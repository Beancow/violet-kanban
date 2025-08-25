'use client';
import { useEffect, useCallback } from 'react';
import { useQueues } from '@/providers/QueueProvider';
import { useSyncErrorProvider } from '@/providers/SyncErrorProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useOrganizationProvider } from '@/providers/OrganizationProvider';
import { useWebWorker } from '@/hooks/useWebWorker';
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

    const processQueuedActions = useCallback(async () => {
        try {
            // worker lifecycle is managed by useWebWorker; messages are handled
            // via the `lastMessage` effect below. We rely on the hook to
            // create/ready the worker before posting messages.

            // refresh token if available
            if (auth.refreshIdToken) await auth.refreshIdToken();
            const freshToken = auth.idToken;

            // Gather all queued actions (any queue) and forward to the worker.
            const state = queueApi.state;
            const allActions = [
                ...(state.boardActionQueue ?? []),
                ...(state.listActionQueue ?? []),
                ...(state.cardActionQueue ?? []),
            ];

            // post regular actions to worker
            allActions.forEach((actionOrItem) => {
                const action = unwrapQueueAction(actionOrItem);
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
                payloadAugmented.idToken = freshToken ?? undefined;
                payloadAugmented.organizationId = orgId ?? undefined;
                console.debug('[SyncManager] posting action to worker', {
                    type: action.type,
                    id: getActionItemId(action),
                    payload: payloadAugmented,
                    isWorkerReady,
                });
                // Worker expects SyncAction/WorkerMessage shapes; wrap as SYNC_DATA
                postMessage({
                    type: 'SYNC_DATA',
                    payload: {
                        ...(base as Record<string, unknown>),
                        payload: payloadAugmented,
                    },
                    timestamp: Date.now(),
                } as any);
            });

            // process org queue
            const orgQueue = queueApi.state.orgActionQueue ?? [];
            for (const item of orgQueue as any[]) {
                if (
                    item.meta?.nextAttemptAt &&
                    item.meta.nextAttemptAt > Date.now()
                )
                    continue;
                const action = unwrapQueueAction(item);
                try {
                    if (auth.refreshIdToken) await auth.refreshIdToken();
                    const token = auth.idToken;
                    const res = await fetch('/api/orgs', {
                        method: 'GET',
                        headers: token
                            ? { Authorization: `Bearer ${token}` }
                            : {},
                    });
                    if (!res.ok) {
                        const body = await res.json().catch(() => null);
                        throw new Error(
                            body && body.error
                                ? String(body.error)
                                : `Failed to fetch organizations: ${res.status}`
                        );
                    }
                    const body = await res.json();
                    if (
                        body &&
                        body.success &&
                        Array.isArray(body.organizations)
                    ) {
                        if (org.setOrganizations)
                            org.setOrganizations(body.organizations);
                        if (org.setLoading) org.setLoading(false);
                        const itemId =
                            getActionItemId(item) || getActionItemId(action);
                        if (itemId && queueApi.removeOrgAction)
                            queueApi.removeOrgAction(itemId);
                    } else {
                        throw new Error(
                            'Unexpected response fetching organizations'
                        );
                    }
                } catch (err) {
                    if (syncError.addError)
                        syncError.addError({
                            timestamp: Date.now(),
                            message:
                                (err as Error).message ||
                                'Failed to fetch organizations',
                            actionType: action.type,
                            payload: isObject(action.payload)
                                ? (action.payload as Record<string, unknown>)
                                : undefined,
                        });
                    console.error(
                        '[SyncManager] org fetch failed',
                        err,
                        action
                    );
                    try {
                        if (queueApi.requeueOrgAction) {
                            const newMeta = (
                                await import('@/providers/helpers')
                            ).scheduleNextAttempt(
                                item.meta ?? {
                                    enqueuedAt: Date.now(),
                                    attempts: 0,
                                    nextAttemptAt: null,
                                    ttlMs: null,
                                    lastError: null,
                                }
                            );
                            queueApi.requeueOrgAction(
                                getActionItemId(item) ||
                                    getActionItemId(action) ||
                                    String(Date.now()),
                                newMeta
                            );
                        }
                    } catch (e) {
                        console.error(
                            '[SyncManager] failed to schedule org fetch retry',
                            e
                        );
                    }
                }
            }
        } catch (e) {
            console.error('[SyncManager] processQueuedActions failed', e);
        }
    }, [queueApi, auth, org, syncError]);

    // Handle messages coming from the worker (mirrors previous onmessage)
    useEffect(() => {
        if (!lastMessage) return;
        const { type, payload, error } = lastMessage as Record<string, unknown>;
        console.debug('[SyncManager] worker.onmessage', {
            type,
            payload,
            error,
        });
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
    }, [lastMessage, queueApi, syncError]);

    // expose debug getter & install listeners
    useEffect(() => {
        // initial pass
        void processQueuedActions();

        // rely on user / browser events to trigger ad-hoc processing
        window.addEventListener('focus', processQueuedActions);
        window.addEventListener('online', processQueuedActions);

        return () => {
            window.removeEventListener('focus', processQueuedActions);
            window.removeEventListener('online', processQueuedActions);
        };
    }, [processQueuedActions, queueApi, auth]);

    // Enqueue fetch-organizations when auth transitions to authenticated
    useEffect(() => {
        // run only when auth becomes available
        if (!auth.hasAuth) return;
        try {
            if (queueApi.enqueueOrgAction) {
                const fetchOrgsAction: VioletKanbanAction = {
                    type: 'fetch-organizations',
                    payload: {
                        userId:
                            auth.storedUser?.uid ??
                            auth.authUser?.uid ??
                            'unknown',
                        timestamp: Date.now(),
                    },
                } as VioletKanbanAction;

                const already = (queueApi.state.orgActionQueue ?? []).some(
                    (qi) => {
                        let a: VioletKanbanAction | undefined;
                        if (isQueueItem(qi)) a = unwrapQueueAction(qi);
                        else if (isActionLike(qi)) a = qi as VioletKanbanAction;
                        if (!a) return false;
                        if (a.type !== 'fetch-organizations') return false;
                        if (!isObject(a.payload)) return false;
                        const userId = (a.payload as Record<string, unknown>)
                            .userId as string | undefined;
                        return (
                            userId ===
                            (fetchOrgsAction.payload as Record<string, unknown>)
                                .userId
                        );
                    }
                );

                if (!already) {
                    console.debug(
                        '[SyncManager] enqueuing fetch-organizations (auth transition)',
                        {
                            payload: fetchOrgsAction.payload,
                        }
                    );
                    queueApi.enqueueOrgAction(fetchOrgsAction);
                    // trigger a processing pass
                    // read current process function via queueApiRef if available
                    if (typeof window !== 'undefined') {
                        // schedule next tick to allow enqueue to persist
                        setTimeout(() => {
                            try {
                                // call processQueuedActions indirectly by dispatching a focus event
                                window.dispatchEvent(new Event('focus'));
                            } catch (e) {
                                console.debug(
                                    '[SyncManager] failed to trigger process on auth transition',
                                    e
                                );
                            }
                        }, 50);
                    }
                }
            }
        } catch (e) {
            console.error(
                '[SyncManager] failed to enqueue fetch-organizations on auth transition',
                e
            );
        }
    }, [auth.hasAuth]);

    return null; // manager component doesn't render
}
