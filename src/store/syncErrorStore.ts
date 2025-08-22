import { create } from 'zustand';

// Zustand error store for sync errors
interface SyncError {
    timestamp: number;
    message: string;
    actionType?: string;
    payload?: unknown;
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

export default useSyncErrorStore;
