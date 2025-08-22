'use client';

import { useEffect, useRef } from 'react';
import { getQueueAdapter } from '@/providers/adapter';
import { useQueueStore } from '@/providers/QueueProvider';
import { useSyncErrorProvider } from '@/providers/SyncErrorProvider';
import { useAuthProvider } from '@/providers/AuthProvider';
import { useOrganizationProvider } from '@/providers/OrganizationProvider';

export function SyncManager() {
    const queueApi = useQueueStore();
    const { boardActionQueue, listActionQueue, cardActionQueue } =
        queueApi.state;
    const syncError = useSyncErrorProvider();
    const auth = useAuthProvider();
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
                const { type, payload, error } = event.data;
                const queueAdapter = getQueueAdapter();
                if (type === 'ACTION_SUCCESS') {
                    const tempId = payload?.tempId;
                    if (payload?.board) {
                        queueAdapter?.enqueueBoardAction?.({
                            type: 'RECONCILE_BOARD',
                            payload: { tempId, board: payload.board },
                        } as any);
                    } else if (payload?.list) {
                        queueAdapter?.enqueueListAction?.({
                            type: 'RECONCILE_LIST',
                            payload: { tempId, list: payload.list },
                        } as any);
                    } else if (payload?.card) {
                        queueAdapter?.enqueueCardAction?.({
                            type: 'RECONCILE_CARD',
                            payload: { tempId, card: payload.card },
                        } as any);
                    }
                } else if (type === 'ERROR' || type === 'ACTION_ERROR') {
                    if (syncError.addError) {
                        syncError.addError({
                            timestamp: payload?.timestamp || Date.now(),
                            message: error?.message || 'Unknown sync error',
                            actionType: payload?.type,
                            payload,
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
            const queueAdapter = getQueueAdapter();
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
                    syncWorker.postMessage({
                        ...action,
                        payload: {
                            ...action.payload,
                            idToken: freshToken,
                            organizationId: orgId,
                        },
                    });
                });
            });
        }

        // start worker and initial pass
        try {
            initWorker();
            processQueuedActions();
        } catch {
            // ignore during SSR / no-window scenarios
        }

        return () => {
            // cleanup
            if (worker) {
                try {
                    worker.terminate();
                } catch {
                    /* ignore */
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
