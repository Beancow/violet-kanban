'use client';
import { useCallback, useEffect, useRef } from 'react';
import { safeCaptureException } from '@/lib/sentryWrapper';
import { useQueues } from '@/providers/QueueProvider';
import { useSyncErrorProvider } from '@/providers/SyncErrorProvider';
import { useOrganizationProvider } from '@/providers/OrganizationProvider';
import { useWebWorker } from '@/hooks/useWebWorker';
import useFreshToken from '@/hooks/useFreshToken';
import {
    isObject,
    hasTempId,
    hasBoardProp,
    hasListProp,
    hasCardProp,
    hasTimestampProp,
    hasTypeProp,
    hasOrganizationIdInData,
    hasIdProp,
    isStringId,
} from '@/types/typeGuards';
import { isActionLike } from '@/types/typeGuards';
import {
    unwrapQueueAction,
    getActionItemId,
    isQueueItem,
} from '@/providers/helpers';
import { isValidWorkerAction, sanitizeQueue } from '@/providers/helpers';
import type { VioletKanbanAction } from '@/types';
import { useReconciliation } from '@/providers/ReconciliationProvider';
import { useTempIdMap } from '@/providers/TempIdMapProvider';
import { emitEvent, onEvent } from '@/utils/eventBusClient';
import SyncOrchestrator from '@/services/SyncOrchestrator';

export default function SyncManager() {
    const queueApi = useQueues();
    const syncError = useSyncErrorProvider();
    const org = useOrganizationProvider();
    const { postMessage, lastMessage } = useWebWorker();
    const getFreshToken = useFreshToken();
    const reconciliation = useReconciliation();
    const tempMap = useTempIdMap();
    const tempMapRef = useRef(tempMap);
    useEffect(() => {
        tempMapRef.current = tempMap;
    }, [tempMap]);

    // Keep tempMapRef in sync via eventBus so other producers can update
    // mappings without requiring consumer identity churn.
    useEffect(() => {
        try {
            const offSet = onEvent('tempid:set', () => {
                // nothing to do here; tempMap provider already updated
                // but consumers may want to react — we keep tempMapRef current
                // so other logic can read mappings.
                tempMapRef.current = tempMap;
            });
            const offCleared = onEvent('tempid:cleared', () => {
                tempMapRef.current = tempMap;
            });
            return () => {
                try {
                    if (typeof offSet === 'function') offSet();
                    if (typeof offCleared === 'function') offCleared();
                } catch (_) {}
            };
        } catch (_) {
            /* ignore */
        }
    }, [tempMap]);

    // Hold refs to provider APIs so we don't re-run effects when test mocks
    // return new object identities on every render.
    const queueApiRef = useRef(queueApi);
    useEffect(() => {
        queueApiRef.current = queueApi;
    }, [queueApi]);
    const syncErrorRef = useRef(syncError);
    useEffect(() => {
        syncErrorRef.current = syncError;
    }, [syncError]);
    const reconciliationRef = useRef(reconciliation);
    useEffect(() => {
        reconciliationRef.current = reconciliation;
    }, [reconciliation]);
    const orgRef = useRef(org);
    useEffect(() => {
        orgRef.current = org;
    }, [org]);
    const getFreshTokenRef = useRef(getFreshToken);
    useEffect(() => {
        getFreshTokenRef.current = getFreshToken;
    }, [getFreshToken]);

    const inFlightRef = useRef<
        import('@/types/syncManager.types').SyncManagerInFlightRef
    >({ waiting: false });

    // Track scheduled timeouts so we can clear them on unmount (prevents
    // Jest/node from hanging because of recurring zero-delay timeouts).
    const scheduledTimeoutsRef = useRef<number[]>([]);
    const mountedRef = useRef(true);

    // Helper to schedule a timeout only when mounted and record its id so
    // it can be cleared on unmount. Returns the timeout id or undefined if
    // not scheduled.
    const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
        if (!mountedRef.current) return undefined;
        const id = window.setTimeout(fn, ms) as unknown as number;
        try {
            scheduledTimeoutsRef.current.push(id);
        } catch (_) {}
        return id;
    }, []);

    const outgoingLogsRef = useRef<Array<Record<string, unknown>>>([]);
    const outgoingClearTimeoutRef = useRef<number | undefined>(undefined);
    const OUTGOING_LOG_TTL_MS = 5 * 60 * 1000;

    // Capture outgoing worker posts (from main -> worker) so the dev panel can
    // display attempted network calls. `useWebWorker` emits a `worker:outgoing`
    // event when posting; subscribe and mirror into the window global used by
    // `DevWorkerDebugPanel`.
    useEffect(() => {
        try {
            const off = onEvent('worker:outgoing', (m: any) => {
                try {
                    const record: Record<string, unknown> = isObject(m)
                        ? ({ ...m, receivedAt: Date.now() } as any)
                        : { payload: m, receivedAt: Date.now() };
                    try {
                        outgoingLogsRef.current = [record]
                            .concat(outgoingLogsRef.current || [])
                            .slice(0, 200);
                    } catch (_) {
                        outgoingLogsRef.current = [record];
                    }
                    try {
                        (window as any).__violet_worker_outgoing =
                            outgoingLogsRef.current;
                    } catch (e) {
                        safeCaptureException(e as Error);
                    }
                    // reset the auto-clear timer
                    try {
                        if (outgoingClearTimeoutRef.current)
                            window.clearTimeout(
                                outgoingClearTimeoutRef.current
                            );
                    } catch (_) {}
                    const id = scheduleTimeout(() => {
                        outgoingLogsRef.current = [];
                        try {
                            (window as any).__violet_worker_outgoing =
                                outgoingLogsRef.current;
                        } catch (e) {
                            safeCaptureException(e as Error);
                        }
                        outgoingClearTimeoutRef.current = undefined;
                    }, OUTGOING_LOG_TTL_MS) as unknown as number;
                    outgoingClearTimeoutRef.current = id;
                } catch (e) {
                    safeCaptureException(e as Error);
                }
            });
            return () => {
                try {
                    if (typeof off === 'function') off();
                } catch (_) {}
            };
        } catch (e) {
            /* ignore */
        }
    }, []);

    const processQueuedActions = useCallback(async () => {
        try {
            const freshToken = await getFreshTokenRef.current();

            const queueApiLocal = queueApiRef.current;
            const state = queueApiLocal.state ?? {};
            const sanitizers: Array<
                import('@/types/syncManager.types').SanitizerTuple
            > = [
                [state.boardActionQueue, queueApiLocal.removeBoardAction],
                [state.listActionQueue, queueApiLocal.removeListAction],
                [state.cardActionQueue, queueApiLocal.removeCardAction],
            ];
            sanitizers.forEach(([q, remover]) => sanitizeQueue(q, remover));

            const pickNextFrom = (queues: Array<any[] | undefined>) => {
                for (const q of queues) {
                    if (!q || q.length === 0) continue;
                    for (const item of q) {
                        const action = unwrapQueueAction(item);
                        if (!isActionLike(action)) continue;
                        if (hasTypeProp(action)) {
                            const t = String((action as any).type || '');
                            // Treat any reconcile-style action (case-insensitive)
                            // as a local-only signal and do not send it to the
                            // worker to avoid unknown-action errors.
                            if (t.toLowerCase().startsWith('reconcile'))
                                continue;
                        }
                        return item;
                    }
                }
                return undefined;
            };

            const nextItem = pickNextFrom([
                state.boardActionQueue,
                state.listActionQueue,
                state.cardActionQueue,
            ]);
            if (!nextItem) return;

            const action = unwrapQueueAction(nextItem) as VioletKanbanAction;
            if (!isValidWorkerAction(action)) {
                try {
                    if (isQueueItem(nextItem)) {
                        const q = nextItem as Record<string, unknown>;
                        const id =
                            hasIdProp(q) && isStringId(q.id)
                                ? (q.id as string)
                                : undefined;
                        if (id) {
                            queueApi.removeBoardAction(id);
                            queueApi.removeListAction(id);
                            queueApi.removeCardAction(id);
                        }
                    }
                } catch (e) {
                    safeCaptureException(e as Error);
                }
                // Schedule next run only if still mounted; record timeout id
                if (mountedRef.current) {
                    scheduleTimeout(() => void processQueuedActions(), 0);
                }
                return;
            }

            if (inFlightRef.current.waiting) return;
            const orgLocal = orgRef.current;
            const orgId = hasOrganizationIdInData((action as any).payload)
                ? (action as any).payload.data.organizationId
                : orgLocal.currentOrganizationId;

            // helper: build a clean message for the worker using type guards
            const buildActionToPost = (
                a: VioletKanbanAction
            ): Record<string, unknown> => {
                const base = isObject(a)
                    ? (a as Record<string, unknown>)
                    : ({} as Record<string, unknown>);
                const originalPayload = isObject((a as any).payload)
                    ? ({
                          ...((a as any).payload as Record<string, unknown>),
                      } as Record<string, unknown>)
                    : ({} as Record<string, unknown>);

                const payload = {
                    ...originalPayload,
                    ...(freshToken ? { idToken: freshToken } : {}),
                    ...(orgId ? { organizationId: orgId } : {}),
                } as Record<string, unknown>;

                return { ...base, payload };
            };

            const actionToPost = buildActionToPost(action);

            const actionId = getActionItemId(action);
            inFlightRef.current.waiting = true;
            inFlightRef.current.id = actionId;
            inFlightRef.current.meta =
                (isQueueItem(nextItem) ? (nextItem as any).meta : undefined) ||
                undefined;
            inFlightRef.current.promise = new Promise<void>((resolve) => {
                inFlightRef.current.resolve = resolve;
            });

            emitEvent('sync:started', undefined as any);

            postMessage({
                ...(actionToPost as Record<string, unknown>),
                timestamp: Date.now(),
            } as any);

            try {
                const waitPromise = inFlightRef.current.promise;
                const TIMEOUT_MS = 30_000;
                await Promise.race([
                    waitPromise,
                    new Promise((_, reject) => {
                        inFlightRef.current.timeout = window.setTimeout(
                            () => reject(new Error('sync message timeout')),
                            TIMEOUT_MS
                        ) as unknown as number;
                    }),
                ] as any);
            } catch (e) {
                const syncErrorLocal = syncErrorRef.current;
                if (syncErrorLocal) {
                    const msg =
                        e instanceof Error
                            ? e.message
                            : String(e) || 'Sync timeout';
                    let retryCount: number | undefined = undefined;
                    try {
                        const inflight: any = inFlightRef.current as any;
                        if (
                            inflight &&
                            inflight.meta &&
                            typeof inflight.meta.attempts === 'number'
                        )
                            retryCount = inflight.meta.attempts as number;
                    } catch {
                        /* ignore */
                    }
                    try {
                        syncErrorLocal.addError({
                            timestamp: Date.now(),
                            message: msg,
                        });
                    } catch (_) {
                        /* ignore */
                    }
                }
            } finally {
                if (inFlightRef.current.timeout) {
                    window.clearTimeout(inFlightRef.current.timeout as number);
                    inFlightRef.current.timeout = undefined;
                }
                inFlightRef.current.waiting = false;
                emitEvent('sync:stopped', undefined as any);
                inFlightRef.current.resolve = undefined;
                inFlightRef.current.promise = undefined;
                // Schedule next run only if still mounted; record timeout id
                if (mountedRef.current) {
                    scheduleTimeout(() => void processQueuedActions(), 0);
                }
            }
        } catch (e) {
            console.error('[SyncManager] processQueuedActions failed', e);
        }
    }, []);

    // Factor out worker message handling so we can subscribe both to the
    // `lastMessage` hook value and to the in-process `eventBus`.
    const handleWorkerMessage = useCallback((mIn: any) => {
        if (!mIn) return;
        const m = mIn as any;
        const { type, payload, error } = m;

        try {
            if (
                type === 'WORKER_OUTGOING' ||
                type === 'WORKER_OUTGOING_RESULT'
            ) {
                const record = isObject(payload)
                    ? (payload as Record<string, unknown>)
                    : { payload };
                try {
                    (window as any).__violet_worker_outgoing =
                        outgoingLogsRef.current;
                } catch (e) {
                    safeCaptureException(e as Error);
                }
                if (!outgoingClearTimeoutRef.current) {
                    const id = scheduleTimeout(() => {
                        outgoingLogsRef.current = [];
                        try {
                            (window as any).__violet_worker_outgoing =
                                outgoingLogsRef.current;
                        } catch (e) {
                            safeCaptureException(e as Error);
                        }
                        outgoingClearTimeoutRef.current = undefined;
                    }, OUTGOING_LOG_TTL_MS) as unknown as number;
                    outgoingClearTimeoutRef.current = id;
                }
                if (process.env.NODE_ENV !== 'test') {
                    console.debug(
                        '[SyncManager] captured worker outgoing',
                        record
                    );
                }
            }
        } catch (e) {
            safeCaptureException(e as Error);
        }

        if (type === 'ACTION_SUCCESS') {
            try {
                if (hasTempId(payload)) {
                    const t = (payload as any).tempId as string;
                    if (
                        hasBoardProp(payload) &&
                        (payload as any).board &&
                        (payload as any).board.id
                    ) {
                        const realId = String((payload as any).board.id);
                        const current = tempMapRef.current.getRealId?.(t);
                        if (current !== realId) {
                            try {
                                emitEvent('tempid:set-request', {
                                    tempId: t,
                                    realId,
                                } as any);
                            } catch (_) {}
                        }
                    } else if (
                        hasListProp(payload) &&
                        (payload as any).list &&
                        (payload as any).list.id
                    ) {
                        const realId = String((payload as any).list.id);
                        const current = tempMapRef.current.getRealId?.(t);
                        if (current !== realId) {
                            try {
                                emitEvent('tempid:set-request', {
                                    tempId: t,
                                    realId,
                                } as any);
                            } catch (_) {}
                        }
                    } else if (
                        hasCardProp(payload) &&
                        (payload as any).card &&
                        (payload as any).card.id
                    ) {
                        const realId = String((payload as any).card.id);
                        const current = tempMapRef.current.getRealId?.(t);
                        if (current !== realId) {
                            try {
                                emitEvent('tempid:set-request', {
                                    tempId: t,
                                    realId,
                                } as any);
                            } catch (_) {}
                        }
                    }
                }
            } catch (e) {
                safeCaptureException(e as Error);
            }

            emitEvent('reconciliation:request', {
                payload,
                queueItem: m.queueItem,
            } as any);
            // For compatibility with tests and adapters, enqueue a small
            // RECONCILE_* action when the worker returned an object with a
            // concrete id so other systems can react. Guarded to avoid
            // accidental loops.
            try {
                const qa = queueApiRef.current;
                if (qa) {
                    if (hasCardProp(payload) && (payload as any).card?.id) {
                        qa.enqueueCardAction?.({
                            type: 'RECONCILE_CARD',
                            payload: { id: (payload as any).card.id },
                            timestamp: Date.now(),
                        } as any);
                    } else if (
                        hasListProp(payload) &&
                        (payload as any).list?.id
                    ) {
                        qa.enqueueListAction?.({
                            type: 'RECONCILE_LIST',
                            payload: { id: (payload as any).list.id },
                            timestamp: Date.now(),
                        } as any);
                    } else if (
                        hasBoardProp(payload) &&
                        (payload as any).board?.id
                    ) {
                        qa.enqueueBoardAction?.({
                            type: 'RECONCILE_BOARD',
                            payload: { id: (payload as any).board.id },
                            timestamp: Date.now(),
                        } as any);
                    }
                }
            } catch (e) {
                /* ignore */
            }
            return;
        }

        if (type === 'ERROR' || type === 'ACTION_ERROR') {
            const err: any = {
                timestamp: hasTimestampProp(payload)
                    ? (payload as any).timestamp
                    : Date.now(),
                message:
                    (error as Error | undefined)?.message ||
                    'Unknown sync error',
                actionType: hasTypeProp(payload)
                    ? (payload as any).type
                    : undefined,
                payload: isObject(payload)
                    ? (payload as Record<string, unknown>)
                    : undefined,
            };

            if (syncError.addError) syncError.addError(err);
            try {
                safeCaptureException(error as Error);
            } catch (e) {
                console.error(
                    '[SyncManager] Worker error (fallback):',
                    error,
                    payload
                );
            }
            return;
        }

        try {
            const inFlightId = inFlightRef.current?.id;
            let respId: string | undefined;
            if (payload && hasTempId(payload)) respId = (payload as any).tempId;
            else if (payload && isObject(payload)) {
                if (
                    hasCardProp(payload) &&
                    typeof (payload as any).card.id === 'string'
                )
                    respId = (payload as any).card.id;
                else if (
                    hasListProp(payload) &&
                    typeof (payload as any).list.id === 'string'
                )
                    respId = (payload as any).list.id;
                else if (
                    hasBoardProp(payload) &&
                    typeof (payload as any).board.id === 'string'
                )
                    respId = (payload as any).board.id;
                else if (typeof (payload as any).id === 'string')
                    respId = (payload as any).id as string;
            }

            const matched = inFlightId && respId && inFlightId === respId;
            if (matched) {
                if (inFlightRef.current && inFlightRef.current.resolve)
                    inFlightRef.current.resolve();
            } else if (!inFlightId) {
                if (inFlightRef.current && inFlightRef.current.resolve)
                    inFlightRef.current.resolve();
            }
        } catch (err) {
            console.debug(
                '[SyncManager] error resolving in-flight promise',
                err
            );
        }
    }, []);

    useEffect(() => {
        if (lastMessage) handleWorkerMessage(lastMessage);
        // subscribe to eventBus worker messages for more stable delivery
        try {
            const off = onEvent('worker:message', (m: any) => {
                try {
                    handleWorkerMessage(m);
                } catch {
                    /* ignore */
                }
            });
            return () => {
                try {
                    if (typeof off === 'function') off();
                } catch (_) {}
            };
        } catch (e) {
            // no-op
        }
        // Only re-run this effect when `lastMessage` changes. Use refs for
        // other provider APIs to avoid re-running on object identity changes.
    }, [lastMessage]);

    useEffect(() => {
        mountedRef.current = true;
        const orchestrator = new SyncOrchestrator({
            queueApi:
                queueApi as unknown as import('@/types/services').QueueApiLike,
            syncError:
                syncError as unknown as import('@/types/services').SyncErrorLike,
            getFreshToken:
                getFreshToken as unknown as import('@/types/services').FreshTokenFn,
            postMessage:
                postMessage as unknown as import('@/types/services').WebWorkerPoster,
            reconciliation,
            tempMap,
            orgProvider: {
                currentOrganizationId: org.currentOrganizationId ?? undefined,
            },
        });
        orchestrator.start();
        return () => {
            mountedRef.current = false;
            // clear any scheduled timeouts
            try {
                for (const t of scheduledTimeoutsRef.current) {
                    window.clearTimeout(t as number);
                }
            } catch (_) {}
            scheduledTimeoutsRef.current = [];
            try {
                orchestrator.stop();
            } catch (_) {}
        };
    }, [processQueuedActions, queueApi]);

    return null;
}
