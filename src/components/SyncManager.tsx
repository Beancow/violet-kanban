'use client';

import { useEffect, useRef } from 'react';
import { getOrCreateQueueStore } from '@/store/queueStore';
import { useQueueStore } from '@/store/queueStore';
import { useSyncErrorStore } from '@/store/syncErrorStore';
import { getOrCreateAuthStore } from '@/store/authStore';
import { getOrCreateOrganizationStore } from '@/store/organizationStore';
import log from '@/utils/logHelpers';

export function SyncManager() {
    const { boardActionQueue, listActionQueue, cardActionQueue } =
        useQueueStore();
    const { errors, clearErrors } = useSyncErrorStore();
    const lastQueueLength = useRef(
        boardActionQueue.length +
            listActionQueue.length +
            cardActionQueue.length
    );

    // Show toast for sync errors
    useEffect(() => {
        if (errors.length > 0) {
            errors.forEach((err) => {
                log('Error', `Sync error: ${err.message}`);
            });
            clearErrors();
        }
    }, [errors, clearErrors]);

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
            worker = new Worker('/dataSyncWorker.js');

            worker.onmessage = (event) => {
                const { type, payload, error } = event.data;
                if (type === 'ACTION_SUCCESS') {
                    const tempId = payload?.tempId;
                    if (payload?.board) {
                        getOrCreateQueueStore()
                            .getState()
                            .handleBoardActionSuccess(tempId, payload.board);
                    } else if (payload?.list) {
                        getOrCreateQueueStore()
                            .getState()
                            .handleListActionSuccess(tempId, payload.list);
                    } else if (payload?.card) {
                        getOrCreateQueueStore()
                            .getState()
                            .handleCardActionSuccess(tempId, payload.card);
                    }
                } else if (type === 'ERROR' || type === 'ACTION_ERROR') {
                    useSyncErrorStore.getState().addError({
                        timestamp: payload?.timestamp || Date.now(),
                        message: error?.message || 'Unknown sync error',
                        actionType: payload?.type,
                        payload,
                    });
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
            const { boardActionQueue, listActionQueue, cardActionQueue } =
                getOrCreateQueueStore().getState();
            const { refreshIdToken } = getOrCreateAuthStore().getState();
            const { currentOrganizationId } =
                getOrCreateOrganizationStore().getState();
            const syncWorker = initWorker();

            refreshIdToken().then(() => {
                const freshToken = getOrCreateAuthStore().getState().idToken;
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
                        orgId = currentOrganizationId;
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
        } catch (e) {
            // ignore during SSR / no-window scenarios
        }

        return () => {
            // cleanup
            if (worker) {
                try {
                    worker.terminate();
                } catch (e) {
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
