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
            // payload includes local tempId and the created resource (board/list/card)
            const tempId = payload?.tempId;
            if (payload?.board) {
                useQueueStore
                    .getState()
                    .handleBoardActionSuccess(tempId, payload.board);
            } else if (payload?.list) {
                useQueueStore
                    .getState()
                    .handleListActionSuccess(tempId, payload.list);
            } else if (payload?.card) {
                useQueueStore
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
            const payload = action.payload as unknown;
            if (
                payload &&
                typeof payload === 'object' &&
                'data' in (payload as Record<string, unknown>) &&
                (payload as Record<string, unknown>).data &&
                typeof ((payload as Record<string, unknown>).data as Record<string, unknown>).organizationId === 'string'
            ) {
                orgId = ((payload as Record<string, unknown>).data as Record<string, unknown>).organizationId as string;
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
