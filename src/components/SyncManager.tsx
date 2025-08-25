'use client';

import { useEffect, useRef } from 'react';
import { useQueues } from '@/providers/QueueProvider';
import { useSyncErrorProvider } from '@/providers/SyncErrorProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useOrganizationProvider } from '@/providers/OrganizationProvider';
import { isObject } from '@/types/typeGuards';
import type { VioletKanbanAction } from '@/types/violet-kanban-action';
import type { Board, BoardList, BoardCard } from '@/types/appState.type';

export function SyncManager() {
    const queueApi = useQueues();
    const { boardActionQueue, listActionQueue, cardActionQueue } =
        queueApi.state;
    const syncError = useSyncErrorProvider();
    const auth = useAuth();
    const org = useOrganizationProvider();
    const lastQueueLength = useRef(
        boardActionQueue.length +
            listActionQueue.length +
            cardActionQueue.length
    );

    // Show toast for sync errors
    useEffect(() => {
        // show any errors from the sync error provider
        // provider exposes errors array and a clear method
        if (syncError.errors && syncError.errors.length > 0) {
            syncError.errors.forEach((err) => {
                console.error('Sync error:', err.message);
            });
            if (syncError.clearErrors) syncError.clearErrors();
        }
    }, [syncError.errors, syncError.clearErrors]);

    // Update last queue length (used to detect transitions)
    useEffect(() => {
        lastQueueLength.current =
            boardActionQueue.length +
            listActionQueue.length +
            cardActionQueue.length;
    }, [boardActionQueue, listActionQueue, cardActionQueue]);

    useEffect(() => {
        // Worker and interval local to this component
        let worker: Worker | null = null;
        let syncIntervalId: number | null = null;

        function initWorker() {
            if (worker) return worker;
            worker = new Worker('dataSyncWorker.js');

            worker.onmessage = (event) => {
                const { type, payload, error } = event.data as Record<
                    string,
                    unknown
                >;
                // Prefer provider API from hooks (queueApi) instead of module getter
                if (type === 'ACTION_SUCCESS') {
                    const tempId =
                        isObject(payload) &&
                        typeof (payload as Record<string, unknown>).tempId ===
                            'string'
                            ? ((payload as Record<string, unknown>)
                                  .tempId as string)
                            : undefined;
                    if (isObject(payload) && 'board' in payload) {
                        const board = (payload as Record<string, unknown>)
                            .board as Board;
                        if (tempId) {
                            const action: VioletKanbanAction = {
                                type: 'reconcile-board',
                                payload: { tempId, board },
                            } as VioletKanbanAction;
                            queueApi.enqueueBoardAction(action);
                        }
                    } else if (isObject(payload) && 'list' in payload) {
                        const list = (payload as Record<string, unknown>)
                            .list as BoardList;
                        if (tempId) {
                            const action: VioletKanbanAction = {
                                type: 'reconcile-list',
                                payload: { tempId, list },
                            } as VioletKanbanAction;
                            queueApi.enqueueListAction(action);
                        }
                    } else if (isObject(payload) && 'card' in payload) {
                        const card = (payload as Record<string, unknown>)
                            .card as BoardCard;
                        if (tempId) {
                            const action: VioletKanbanAction = {
                                type: 'reconcile-card',
                                payload: { tempId, card },
                            } as VioletKanbanAction;
                            queueApi.enqueueCardAction(action);
                        }
                    }
                } else if (type === 'ERROR' || type === 'ACTION_ERROR') {
                    if (syncError.addError) {
                        syncError.addError({
                            timestamp:
                                isObject(payload) &&
                                typeof (payload as Record<string, unknown>)
                                    .timestamp === 'number'
                                    ? ((payload as Record<string, unknown>)
                                          .timestamp as number)
                                    : Date.now(),
                            message:
                                (error as Error | undefined)?.message ||
                                'Unknown sync error',
                            actionType:
                                isObject(payload) &&
                                typeof (payload as Record<string, unknown>)
                                    .type === 'string'
                                    ? ((payload as Record<string, unknown>)
                                          .type as string)
                                    : undefined,
                            payload: isObject(payload)
                                ? (payload as Record<string, unknown>)
                                : undefined,
                        });
                    }
                    console.error(
                        '[SyncManager] Worker error:',
                        error,
                        payload
                    );
                }
            };

            // periodic triggers
            if (!syncIntervalId) {
                syncIntervalId = window.setInterval(
                    processQueuedActions,
                    30000
                );
            }
            window.addEventListener('focus', processQueuedActions);
            window.addEventListener('online', processQueuedActions);

            return worker;
        }

        function processQueuedActions() {
            // use queueApi provider methods to enqueue actions
            const syncWorker = initWorker();

            // ensure token is fresh
            const refreshPromise = auth.refreshIdToken
                ? auth.refreshIdToken()
                : Promise.resolve();

            refreshPromise.then(() => {
                const freshToken = auth.idToken;
                // read current queues from provider state
                const allActions = [
                    ...boardActionQueue,
                    ...listActionQueue,
                    ...cardActionQueue,
                ];

                allActions.forEach((action) => {
                    let orgId: string | null = null;
                    const payload = action.payload as unknown;
                    if (
                        payload &&
                        typeof payload === 'object' &&
                        'data' in (payload as Record<string, unknown>) &&
                        (payload as Record<string, unknown>).data &&
                        typeof (
                            (payload as Record<string, unknown>).data as Record<
                                string,
                                unknown
                            >
                        ).organizationId === 'string'
                    ) {
                        orgId = (
                            (payload as Record<string, unknown>).data as Record<
                                string,
                                unknown
                            >
                        ).organizationId as string;
                    } else {
                        orgId = org.currentOrganizationId;
                    }
                    // Build a safe payload for the worker: add idToken and organizationId
                    const base: Record<string, unknown> = {};
                    if (action && typeof action === 'object') {
                        // shallow copy action fields
                        Object.assign(base, action);
                    }
                    const payloadAugmented = isObject(action.payload)
                        ? { ...(action.payload as Record<string, unknown>) }
                        : {};
                    // attach auth and org
                    payloadAugmented.idToken = freshToken ?? undefined;
                    payloadAugmented.organizationId = orgId ?? undefined;

                    // Post a SyncActionWithAuth-like message to the worker
                    syncWorker.postMessage({
                        ...(base as Record<string, unknown>),
                        payload: payloadAugmented,
                    });
                });
            });
        }

        // start worker and initial pass
        try {
            initWorker();
            processQueuedActions();
        } catch (e) {
            // Log init errors (e.g., Worker not available during SSR) for diagnostics.
            console.error(
                '[SyncManager] failed to start worker or process queue',
                e
            );
        }

        return () => {
            // cleanup
            if (worker) {
                try {
                    worker.terminate();
                } catch (err) {
                    // Log termination errors for diagnostics
                    console.error(
                        '[SyncManager] failed to terminate worker',
                        err
                    );
                }
                worker = null;
            }
            if (syncIntervalId) {
                clearInterval(syncIntervalId);
                syncIntervalId = null;
            }
            window.removeEventListener('focus', processQueuedActions);
            window.removeEventListener('online', processQueuedActions);
        };
    }, []);

    return null; // manager component doesn't render
}
