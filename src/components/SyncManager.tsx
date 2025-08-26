'use client';
import { useEffect, useCallback, useRef } from 'react';
import { safeCaptureException } from '@/lib/sentryWrapper';
import { useQueues } from '@/providers/QueueProvider';
import { useSyncErrorProvider } from '@/providers/SyncErrorProvider';
import { useAuth } from '@/providers/AuthProvider';
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
} from '@/types/typeGuards';
import { isActionLike } from '@/types/typeGuards';
import {
    unwrapQueueAction,
    getActionItemId,
    isQueueItem,
} from '@/providers/helpers';
import type { VioletKanbanAction, Board, BoardList, BoardCard } from '@/types';

export default function SyncManager() {
    const queueApi = useQueues();
    const syncError = useSyncErrorProvider();
    const auth = useAuth();
    const org = useOrganizationProvider();
    const { postMessage, lastMessage, isWorkerReady } = useWebWorker();
    const getFreshToken = useFreshToken();
    // track a single in-flight message
    const inFlightRef = useRef<{
        waiting: boolean;
        id?: string | undefined;
        promise?: Promise<void>;
        resolve?: () => void;
        timeout?: number | undefined;
    }>({ waiting: false });

    // Dev-only: capture recent outgoing worker network attempts for diagnostics
    const outgoingLogsRef = useRef<Array<Record<string, unknown>>>([]);
    const outgoingClearTimeoutRef = useRef<number | undefined>(undefined);
    const OUTGOING_LOG_TTL_MS = 5 * 60 * 1000; // keep logs for 5 minutes

    // Deduplication moved to `useWebWorker` hook to centralize behavior.

    const MAX_ORG_FETCH_ATTEMPTS = 5;

    const processQueuedActions = useCallback(async () => {
        try {
            // worker lifecycle is managed by useWebWorker; messages are handled
            // via the `lastMessage` effect below. We rely on the hook to
            // create/ready the worker before posting messages.

            // get a fresh token when appropriate (hook centralizes threshold)
            const freshToken = await getFreshToken();

            // Only process one queued action at a time. Find next available
            // queue item (board, list, card) and post a single SYNC_DATA message
            // to the worker, then wait for success/failure before continuing.
            const state = queueApi.state;
            // Pick the next queued action but skip reconcile-* items which are
            // produced by the worker to update local state and should not be
            // re-sent to the worker (would cause echo cycles).
            const pickNext = (q?: any[]) => {
                if (!q || q.length === 0) return undefined;
                for (const item of q) {
                    const action = unwrapQueueAction(item);
                    const t = action && (action as any).type;
                    if (typeof t === 'string' && t.startsWith('reconcile-'))
                        continue;
                    return item;
                }
                return undefined;
            };

            const nextItem =
                pickNext(state.boardActionQueue) ||
                pickNext(state.listActionQueue) ||
                pickNext(state.cardActionQueue);

            if (!nextItem) return; // nothing to do

            // If another message is already in-flight, skip.
            if (inFlightRef.current.waiting) return;

            const action = unwrapQueueAction(nextItem);
            let orgId: string | null = null;
            if (hasOrganizationIdInData(action.payload)) {
                orgId = action.payload.data.organizationId;
            } else {
                orgId = org.currentOrganizationId;
            }
            const base: Record<string, unknown> = {};
            if (action && typeof action === 'object')
                Object.assign(base, action);
            const payloadAugmented = isObject(action.payload)
                ? { ...(action.payload as Record<string, unknown>) }
                : {};
            // Only attach idToken/organizationId when they are present.
            if (freshToken) payloadAugmented.idToken = freshToken;
            if (orgId) payloadAugmented.organizationId = orgId;
            const actionId = getActionItemId(action);
            console.debug('[SyncManager] posting action to worker', {
                type: action.type,
                id: actionId,
                payload: payloadAugmented,
                isWorkerReady,
            });

            // mark in-flight and post
            // record in-flight id (tempId or id) so we can correlate responses
            inFlightRef.current.waiting = true;
            inFlightRef.current.id = actionId;
            // create a promise that will be resolved by the worker message
            // handler (below) when we receive success/error for this item.
            inFlightRef.current.promise = new Promise<void>((resolve) => {
                inFlightRef.current.resolve = resolve;
            });

            // Post the inner action directly so the real worker receives
            // expected action types (e.g. 'create-card'). Tests' fake
            // worker also accepts this shape.
            postMessage({
                ...(base as Record<string, unknown>),
                payload: payloadAugmented,
                timestamp: Date.now(),
            } as any);

            // wait until worker responds (or timeout) before continuing
            try {
                const waitPromise = inFlightRef.current.promise;
                // race with a timeout to avoid permanent lock
                const TIMEOUT_MS = 30_000; // 30s per-message timeout
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
                // timeout or other wait failure — record an error so tests/UX
                // can observe, and clear in-flight so we can continue.
                if (syncError.addError) {
                    const msg =
                        e instanceof Error
                            ? e.message
                            : String(e) || 'Sync timeout';
                    syncError.addError({
                        timestamp: Date.now(),
                        message: msg,
                    });
                }
            } finally {
                // clear any timeout and in-flight state
                if (inFlightRef.current.timeout) {
                    window.clearTimeout(inFlightRef.current.timeout as number);
                    inFlightRef.current.timeout = undefined;
                }
                inFlightRef.current.waiting = false;
                inFlightRef.current.resolve = undefined;
                inFlightRef.current.promise = undefined;
                // continue processing next queued item (if any)
                // schedule on next tick to avoid deep recursion
                setTimeout(() => void processQueuedActions(), 0);
            }

            // Organization fetching and retries have moved to OrganizationProvider.
        } catch (e) {
            console.error('[SyncManager] processQueuedActions failed', e);
        }
    }, [queueApi, auth, org, syncError, getFreshToken]);

    // Handle messages coming from the worker (mirrors previous onmessage)
    useEffect(() => {
        if (!lastMessage) return;
        const { type, payload, error } = lastMessage as Record<string, unknown>;
        console.debug('[SyncManager] worker.onmessage', {
            type,
            payload,
            error,
        });

        // message delivered from useWebWorker (dedupe centralized there)

        // Dev-only capture of worker outgoing events posted by the worker
        try {
            if (process.env.NODE_ENV !== 'production') {
                if (
                    type === 'WORKER_OUTGOING' ||
                    type === 'WORKER_OUTGOING_RESULT'
                ) {
                    const record = {
                        type,
                        payload: isObject(payload)
                            ? (payload as Record<string, unknown>)
                            : payload,
                        receivedAt: Date.now(),
                    };
                    outgoingLogsRef.current.push(
                        record as Record<string, unknown>
                    );
                    // cap log length
                    if (outgoingLogsRef.current.length > 200)
                        outgoingLogsRef.current.shift();
                    // expose for quick debugging in dev only
                    try {
                        // @ts-ignore - dev inspection hook
                        (window as any).__violet_worker_outgoing =
                            outgoingLogsRef.current;
                    } catch (e) {
                        safeCaptureException(e as Error);
                    }
                    // schedule clear if not already scheduled
                    if (!outgoingClearTimeoutRef.current) {
                        outgoingClearTimeoutRef.current = window.setTimeout(
                            () => {
                                outgoingLogsRef.current = [];
                                try {
                                    // @ts-ignore
                                    (window as any).__violet_worker_outgoing =
                                        outgoingLogsRef.current;
                                } catch (e) {
                                    safeCaptureException(e as Error);
                                }
                                outgoingClearTimeoutRef.current = undefined;
                            },
                            OUTGOING_LOG_TTL_MS
                        ) as unknown as number;
                    }
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
            const tempId = hasTempId(payload)
                ? (payload as any).tempId
                : undefined;
            if (hasBoardProp(payload)) {
                const board = (payload as any).board as Board;
                if (tempId)
                    queueApi.enqueueBoardAction({
                        type: 'reconcile-board',
                        payload: { tempId, board },
                    } as VioletKanbanAction);
            } else if (hasListProp(payload)) {
                const list = (payload as any).list as BoardList;
                if (tempId)
                    queueApi.enqueueListAction({
                        type: 'reconcile-list',
                        payload: { tempId, list },
                    } as VioletKanbanAction);
            } else if (hasCardProp(payload)) {
                const card = (payload as any).card as BoardCard;
                if (tempId)
                    queueApi.enqueueCardAction({
                        type: 'reconcile-card',
                        payload: { tempId, card },
                    } as VioletKanbanAction);
            }
        } else if (type === 'ERROR' || type === 'ACTION_ERROR') {
            if (syncError.addError)
                syncError.addError({
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
                });
            console.error('[SyncManager] Worker error:', error, payload);
        }
        // Only resolve the in-flight promise when the incoming worker
        // message correlates to the currently in-flight action. This avoids
        // unrelated worker messages from allowing the manager to progress
        // and re-post queue items, which can cause duplicate server calls.
        try {
            const inFlightId = inFlightRef.current?.id;
            let respId: string | undefined = undefined;
            if (payload && hasTempId(payload)) {
                respId = (payload as any).tempId;
            } else if (payload && isObject(payload)) {
                // try common shapes: payload.card|list|board.{id}
                const p = payload as Record<string, unknown>;
                if (p.card && typeof (p.card as any).id === 'string')
                    respId = (p.card as any).id;
                else if (p.list && typeof (p.list as any).id === 'string')
                    respId = (p.list as any).id;
                else if (p.board && typeof (p.board as any).id === 'string')
                    respId = (p.board as any).id;
                else if (typeof p.id === 'string') respId = p.id as string;
            }

            const matched = inFlightId && respId && inFlightId === respId;
            if (matched) {
                console.debug(
                    '[SyncManager] worker response matches in-flight id',
                    {
                        inFlightId,
                        respId,
                        type,
                    }
                );
                if (inFlightRef.current && inFlightRef.current.resolve)
                    inFlightRef.current.resolve();
            } else if (!inFlightId) {
                // no in-flight id recorded: fallback to resolve to avoid lockups
                console.debug(
                    '[SyncManager] no in-flight id recorded; resolving to avoid lock',
                    { type, respId }
                );
                if (inFlightRef.current && inFlightRef.current.resolve)
                    inFlightRef.current.resolve();
            } else {
                // unrelated message — ignore for the purposes of in-flight
                console.debug(
                    '[SyncManager] ignoring unrelated worker message',
                    {
                        inFlightId,
                        respId,
                        type,
                    }
                );
            }
        } catch (err) {
            // non-fatal
            console.debug(
                '[SyncManager] error resolving in-flight promise',
                err
            );
        }
    }, [lastMessage, queueApi, syncError]);

    // expose debug getter & install listeners
    useEffect(() => {
        // initial pass
        void processQueuedActions();

        // rely on user / browser events to trigger ad-hoc processing
        window.addEventListener('focus', processQueuedActions);
        // also listen for explicit queue updates from QueueProvider so that
        // user-initiated enqueues trigger an immediate sync run. The event
        // may contain an advisory `detail.kind` hint (board|list|card) which
        // we treat as a hint only; SyncManager will still re-evaluate all
        // queues to preserve ordering guarantees.
        const onQueueUpdated = (ev: Event) => {
            try {
                const ce = ev as CustomEvent | any;
                const kind = ce?.detail?.kind;
                if (kind)
                    console.debug('[SyncManager] queue updated hint', { kind });
            } catch (e) {
                /* ignore */
            }
            void processQueuedActions();
        };
        window.addEventListener(
            'violet:queue:updated',
            onQueueUpdated as EventListener
        );
        window.addEventListener('online', processQueuedActions);

        return () => {
            window.removeEventListener('focus', processQueuedActions);
            window.removeEventListener(
                'violet:queue:updated',
                onQueueUpdated as EventListener
            );
            window.removeEventListener('online', processQueuedActions);
        };
    }, [processQueuedActions, queueApi, auth]);

    // Organization fetch on auth transition is now handled by OrganizationProvider

    return null; // manager component doesn't render
}
