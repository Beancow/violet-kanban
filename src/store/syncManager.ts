import { useQueueStore } from './queueStore';
import { useAuthStore } from './authStore';
import { useOrganizationStore } from './organizationStore';
import { create } from 'zustand';

// Zustand error store for sync errors
interface SyncError {
    timestamp: number;
    message: string;
    actionType?: string;
    payload?: any;
}

interface SyncErrorState {
    errors: SyncError[];
    addError: (error: SyncError) => void;
    clearErrors: () => void;
}

export const useSyncErrorStore = create<SyncErrorState>((set) => ({
    errors: [],
    addError: (error) => set((state) => ({ errors: [...state.errors, error] })),
    clearErrors: () => set({ errors: [] }),
}));

let worker: Worker | null = null;
let syncIntervalId: number | null = null;

export function initSyncWorker() {
    if (worker) return worker;
    worker = new Worker('/dataSyncWorker.js');

    worker.onmessage = (event) => {
        const { type, payload, error } = event.data;
        if (type === 'ACTION_SUCCESS') {
            if (payload.boardId) {
                useQueueStore
                    .getState()
                    .handleBoardActionSuccess(payload.timestamp, payload);
            } else if (payload.listId) {
                useQueueStore
                    .getState()
                    .handleListActionSuccess(payload.timestamp, payload);
            } else if (payload.cardId) {
                useQueueStore
                    .getState()
                    .handleCardActionSuccess(payload.timestamp, payload);
            }
        } else if (type === 'ERROR' || type === 'ACTION_ERROR') {
            useSyncErrorStore.getState().addError({
                timestamp: payload?.timestamp || Date.now(),
                message: error?.message || 'Unknown sync error',
                actionType: payload?.type,
                payload,
            });
            console.error('[SyncManager] Worker error:', error, payload);
        }
    };

    // Automatic triggers
    // 1. Sync every 30 seconds
    if (!syncIntervalId) {
        syncIntervalId = window.setInterval(processQueuedActions, 30000);
    }
    // 2. Sync when window regains focus
    window.addEventListener('focus', processQueuedActions);
    // 3. Sync when network comes online
    window.addEventListener('online', processQueuedActions);

    return worker;
}

export function processQueuedActions() {
    const { boardActionQueue, listActionQueue, cardActionQueue } =
        useQueueStore.getState();
    const { refreshIdToken } = useAuthStore.getState();
    const { currentOrganizationId } = useOrganizationStore.getState();
    const syncWorker = initSyncWorker();

    refreshIdToken().then(() => {
        const freshToken = useAuthStore.getState().idToken;
        const allActions = [
            ...boardActionQueue,
            ...listActionQueue,
            ...cardActionQueue,
        ];
        allActions.forEach((action) => {
            let orgId: string | null = null;
            const payload = action.payload as Record<string, any>;
            if (
                payload.data &&
                typeof payload.data.organizationId === 'string'
            ) {
                orgId = payload.data.organizationId;
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
