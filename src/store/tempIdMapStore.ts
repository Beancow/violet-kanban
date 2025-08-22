import { create, StoreApi, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { isUseBoundStore } from './factoryHelpers';

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
                // remove key from map
                const { [tempId]: _removed, ...rest } = state.tempIdMap;
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

/** Initialize the global temp id map store. Call from a client-only provider. */
export function initializeTempIdMapStore(
    persistEnabled = typeof window !== 'undefined'
) {
    if (!_tempIdMapStore) {
        _tempIdMapStore = createTempIdMapStore(persistEnabled);
    }
    return _tempIdMapStore;
}

/** Returns the StoreApi if initialized, otherwise null. */
export function getTempIdMapStoreIfReady():
    | import('zustand').UseBoundStore<StoreApi<TempIdMapState>>
    | null {
    return _tempIdMapStore;
}

/**
 * Strict getter: throws if the store hasn't been initialized. This makes
 * incorrect server-side or early calls fail fast and encourages explicit
 * initialization inside a client provider.
 */
export function getOrCreateTempIdMapStore(): import('zustand').UseBoundStore<
    StoreApi<TempIdMapState>
> {
    if (!_tempIdMapStore) {
        if (typeof window === 'undefined') {
            return createTempIdMapStore(
                false
            ) as unknown as import('zustand').UseBoundStore<
                StoreApi<TempIdMapState>
            >;
        }
        throw new Error(
            'TempIdMap store not initialized. Call initializeTempIdMapStore() from a client provider before using non-React APIs.'
        );
    }
    return _tempIdMapStore;
}

/** Factory for tests: create a fresh store instance without touching the global singleton. */
export function createTempIdMapStoreForTest() {
    return createTempIdMapStore(false);
}

export const useTempIdMapStore: import('zustand').UseBoundStore<
    StoreApi<TempIdMapState>
> = ((...args: Array<unknown>) => {
    const store = getOrCreateTempIdMapStore();
    if (isUseBoundStore<TempIdMapState>(store)) {
        const selector = (args.length > 0 ? args[0] : undefined) as
            | ((s: TempIdMapState) => unknown)
            | undefined;
        return (
            store as unknown as (
                selector?: (s: TempIdMapState) => unknown
            ) => unknown
        )(selector);
    }
    const selector = args[0] as unknown;
    const storeApi = store as import('zustand').StoreApi<TempIdMapState>;
    if (typeof selector === 'function') {
        return (selector as (s: TempIdMapState) => unknown)(
            storeApi.getState()
        );
    }
    return storeApi.getState();
}) as unknown as import('zustand').UseBoundStore<StoreApi<TempIdMapState>>;
