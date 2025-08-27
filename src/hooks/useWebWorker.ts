import { useCallback, useEffect, useRef, useState } from 'react';

export function createDedupe(opts?: {
    dedupeTtlMs?: number;
    dedupeMaxSeen?: number;
}) {
    const DUP_TTL_MS = opts?.dedupeTtlMs ?? 60_000;
    const MAX_SEEN = opts?.dedupeMaxSeen ?? 1000;
    const seenMessages = new Map<string, number>();

    const makeMessageKey = (type?: any, payload?: any) => {
        try {
            let respId: string | undefined;
            if (payload && typeof payload === 'object') {
                const p = payload as Record<string, unknown>;
                if (p.tempId && typeof p.tempId === 'string')
                    respId = p.tempId as string;
                else if (p.card && (p.card as any).id)
                    respId = (p.card as any).id as string;
                else if (p.list && (p.list as any).id)
                    respId = (p.list as any).id as string;
                else if (p.board && (p.board as any).id)
                    respId = (p.board as any).id as string;
                else if (typeof p.id === 'string') respId = p.id as string;
            }
            if (respId) return `${String(type)}:${respId}`;
            const s = JSON.stringify(payload ?? '');
            return `${String(type)}:${s.slice(0, 200)}`;
        } catch (err) {
            // best-effort: log in dev and capture to Sentry
            try {
                safeCaptureException(err as Error);
            } catch (_) {
                /* ignore */
            }
            if (process.env.NODE_ENV !== 'production')
                console.debug('[useWebWorker] makeMessageKey failed', err);
            return String(type ?? 'unknown');
        }
    };

    const isDuplicateMessage = (type?: any, payload?: any) => {
        const key = makeMessageKey(type, payload);
        const now = Date.now();
        for (const [k, ts] of seenMessages) {
            if (now - ts > DUP_TTL_MS) seenMessages.delete(k);
        }
        if (seenMessages.has(key)) return true;
        seenMessages.set(key, now);
        if (seenMessages.size > MAX_SEEN) {
            let oldestKey: string | undefined;
            let oldestTs = Infinity;
            for (const [k, ts] of seenMessages)
                if (ts < oldestTs) (oldestTs = ts), (oldestKey = k);
            if (oldestKey) seenMessages.delete(oldestKey);
        }
        return false;
    };

    return { isDuplicateMessage };
}
import { safeCaptureException } from '@/lib/sentryWrapper';
import { emitEvent } from '@/utils/eventBusClient';
import { type WorkerMessage } from '@/types';
export function useWebWorker(opts?: {
    dedupeTtlMs?: number;
    dedupeMaxSeen?: number;
}) {
    const workerRef = useRef<Worker | null>(null);
    const [isWorkerReady, setIsWorkerReady] = useState(false);
    const [workerError, setWorkerError] = useState<string | null>(null);
    const [lastMessage, setLastMessage] = useState<WorkerMessage | null>(null);
    const [workerVersion, setWorkerVersion] = useState<string | null>(null);
    const [workerVerbose, setWorkerVerbose] = useState<boolean>(false);
    const EXPECTED_WORKER_VERSION = '1.0.0';
    // Create a dedupe instance for this hook
    const { isDuplicateMessage } = createDedupe({
        dedupeTtlMs: opts?.dedupeTtlMs,
        dedupeMaxSeen: opts?.dedupeMaxSeen,
    });

    useEffect(() => {
        if (typeof Worker !== 'undefined') {
            try {
                const createWorker = () => {
                    const newWorker = new window.Worker('/dataSyncWorker.js');
                    newWorker.onmessage = (
                        e: MessageEvent<
                            WorkerMessage | { type: string; version?: string }
                        >
                    ) => {
                        if (!e || !e.data) return;

                        // Always allow version/ready messages through
                        const t = e.data && (e.data as any).type;
                        if (t === 'WORKER_READY' || t === 'WORKER_VERSION') {
                            setLastMessage(e.data as WorkerMessage);
                            emitEvent(
                                'worker:message',
                                e.data as WorkerMessage
                            );
                        } else {
                            // Prevent duplicate/echoed messages from being delivered
                            try {
                                const payload = (e.data as any).payload;
                                if (isDuplicateMessage(t, payload)) {
                                    if (workerVerbose) {
                                        console.debug(
                                            '[useWebWorker] ignoring duplicate worker message',
                                            { type: t }
                                        );
                                    }
                                    return;
                                }
                                setLastMessage(e.data as WorkerMessage);
                                emitEvent(
                                    'worker:message',
                                    e.data as WorkerMessage
                                );
                            } catch (err) {
                                // fallback to delivering message; surface in dev and capture to Sentry
                                try {
                                    safeCaptureException(err as Error);
                                } catch {
                                    /* ignore */
                                }
                                if (process.env.NODE_ENV !== 'production')
                                    console.debug(
                                        '[useWebWorker] failed to dedupe message',
                                        err
                                    );
                                setLastMessage(e.data as WorkerMessage);
                            }
                        }

                        // Track worker verbose flag set events so the hook can
                        // suppress noisy debug messages unless explicit verbose
                        // mode is enabled by the main thread.
                        if (e.data && e.data.type === 'WORKER_VERBOSE_SET') {
                            try {
                                setWorkerVerbose(!!(e.data as any).verbose);
                            } catch (_) {
                                setWorkerVerbose(false);
                            }
                        }

                        // Special handling for ready/version to update internal state
                        if (e.data.type === 'WORKER_READY') {
                            setIsWorkerReady(true);
                            if (
                                'version' in e.data &&
                                typeof e.data.version === 'string'
                            ) {
                                setWorkerVersion(e.data.version);
                                if (
                                    e.data.version !== EXPECTED_WORKER_VERSION
                                ) {
                                    setIsWorkerReady(false);
                                    newWorker.terminate();
                                    workerRef.current = createWorker();
                                    workerRef.current.postMessage({
                                        type: 'GET_WORKER_VERSION',
                                    });
                                }
                            }
                        }
                        if (e.data.type === 'WORKER_VERSION') {
                            setWorkerVersion(e.data.version || null);
                            if (e.data.version !== EXPECTED_WORKER_VERSION) {
                                setIsWorkerReady(false);
                                newWorker.terminate();
                                workerRef.current = createWorker();
                                workerRef.current.postMessage({
                                    type: 'GET_WORKER_VERSION',
                                });
                            }
                        }
                    };
                    newWorker.onerror = (err) => {
                        // Log worker error for diagnostics
                        console.error('useWebWorker worker error', err);
                        setWorkerError('Web Worker encountered an error');
                        setIsWorkerReady(false);
                        safeCaptureException(err as unknown as Error);
                    };
                    // Request worker version on init
                    newWorker.postMessage({ type: 'GET_WORKER_VERSION' });
                    return newWorker;
                };
                workerRef.current = createWorker();
            } catch (err) {
                // Log worker creation errors including the caught error value
                console.error('useWebWorker failed to create worker', err);
                try {
                    safeCaptureException(err as Error);
                } catch {}
                setWorkerError('Failed to create web worker');
            }
        } else {
            setWorkerError('Web Workers are not supported');
        }

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, []);

    const postMessage = useCallback((message: WorkerMessage) => {
        if (!workerRef.current) return;
        try {
            // Ensure outgoing messages are tagged with main origin so the
            // worker (or other listeners) can detect origin and avoid echoing.
            const m = { ...(message as any) } as any;
            if (!m.meta) m.meta = { origin: 'main' };
            else if (!m.meta.origin) m.meta.origin = 'main';
            workerRef.current.postMessage(m);
            emitEvent('worker:outgoing', m as any);
            try {
                // Mirror outgoing to window global as a fallback so dev panels
                // can show outgoing attempts even if no listener is registered
                // yet (race conditions during early app init).
                const arr = (window as any).__violet_worker_outgoing || [];
                const rec = { ...(m as any), receivedAt: Date.now() } as any;
                try {
                    // keep list bounded
                    (window as any).__violet_worker_outgoing = [rec]
                        .concat(arr)
                        .slice(0, 200);
                } catch (_) {
                    (window as any).__violet_worker_outgoing = [rec];
                }
            } catch (e) {
                /* ignore */
            }
        } catch (e) {
            // best-effort
            try {
                workerRef.current.postMessage(message as any);
            } catch (err) {
                try {
                    safeCaptureException(err as Error);
                } catch {}
            }
        }
    }, []);

    return {
        isWorkerReady,
        workerError,
        lastMessage,
        postMessage,
        workerVersion,
    };
}
