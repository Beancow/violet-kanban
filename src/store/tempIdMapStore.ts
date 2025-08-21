import { create, StoreApi, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TempIdMapState {
    tempIdMap: Record<string, string>; // tempId -> realId
    setMapping: (tempId: string, realId: string) => void;
    getRealId: (tempId: string) => string | undefined;
    clearMapping: (tempId: string) => void;
    clearAll: () => void;
}

// Factory: create a fresh tempId map store. If `persistEnabled` is true, wrap with persist middleware.
export function createTempIdMapStore(
    persistEnabled = true
): import('zustand').UseBoundStore<StoreApi<TempIdMapState>> {
    const creator: StateCreator<TempIdMapState> = (set, get) => ({
        tempIdMap: {},
        setMapping: (tempId: string, realId: string) =>
            set((state: TempIdMapState) => ({
                tempIdMap: { ...state.tempIdMap, [tempId]: realId },
            })),
        getRealId: (tempId: string) => get().tempIdMap[tempId],
        clearMapping: (tempId: string) =>
            set((state: TempIdMapState) => {
                const { [tempId]: _, ...rest } = state.tempIdMap;
                return { tempIdMap: rest };
            }),
        clearAll: () => set({ tempIdMap: {} }),
    });

    if (persistEnabled) {
        return create<TempIdMapState>()(
            persist(creator, { name: 'violet-kanban-tempidmap-storage' })
        );
    }
    return create<TempIdMapState>()(creator);
}

// Singleton for browser/runtime usage. Tests should call `createTempIdMapStore(false)` to get a test instance.
let _tempIdMapStore:
    | import('zustand').UseBoundStore<StoreApi<TempIdMapState>>
    | null = null;
export function getOrCreateTempIdMapStore(): import('zustand').UseBoundStore<
    StoreApi<TempIdMapState>
> {
    if (!_tempIdMapStore) {
        // Persist only when running in browser
        const persistEnabled = typeof window !== 'undefined';
        _tempIdMapStore = createTempIdMapStore(persistEnabled);
    }
    return _tempIdMapStore;
}

export const useTempIdMapStore = getOrCreateTempIdMapStore();
