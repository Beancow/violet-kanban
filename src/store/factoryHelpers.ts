import { StateCreator } from 'zustand';

// Helper to optionally wrap a store with persist only in browser runtime.
// For tests we can pass { persist: false } to disable persistence.
export function createStoreFactory<T>(creator: StateCreator<T>) {
    return (persistEnabled = true) => {
        // If persist is disabled, return the creator; tests can call factory(false) to get the raw creator.
        return creator as unknown as StateCreator<T>;
    };
}

// Type guard: detect a Zustand UseBoundStore-like object. A UseBoundStore
// is a callable function (selector) that also has getState/setState/subscribe.
export function isUseBoundStore<T = unknown>(
    obj: unknown
): obj is ((selector?: (s: T) => unknown) => unknown) & {
    getState: () => T;
    setState: (s: Partial<T> | ((prev: T) => T)) => void;
    subscribe: (listener: (state: T, prevState?: T) => void) => () => void;
} {
    if (typeof obj !== 'function') return false;
    const maybeObj = obj as unknown as Record<string, unknown>;
    return (
        typeof maybeObj.getState === 'function' &&
        typeof maybeObj.setState === 'function' &&
        typeof maybeObj.subscribe === 'function'
    );
}
// (duplicate guard removed)

export default createStoreFactory;

// Lightweight adapter interfaces for stores used by queueStore.
// These capture the small surface area queueStore needs and avoid broad `any` usage.
export interface BoardStoreAdapter {
    addBoard?: (b: import('../types/appState.type').Board) => void;
    getState?: () => unknown;
}

export interface ListStoreAdapter {
    addList?: (l: import('../types/appState.type').BoardList) => void;
    getState?: () => unknown;
}

export interface CardStoreAdapter {
    addCard?: (c: import('../types/appState.type').BoardCard) => void;
    getState?: () => unknown;
}

// Helper to normalize an unknown store-like object into a Zustand StoreApi<T> if possible.
import type { StoreApi } from 'zustand';
export function getStoreApi<T = unknown>(
    maybe: unknown
): StoreApi<T> | undefined {
    if (!maybe) return undefined;
    // If it's a useBoundStore (callable with getState/setState/subscribe)
    if (isUseBoundStore<T>(maybe)) {
        return maybe as unknown as StoreApi<T>;
    }
    // If it's an adapter-like object with getState
    if (typeof maybe === 'object' && maybe !== null) {
        const obj = maybe as { getState?: unknown };
        if (typeof obj.getState === 'function') return maybe as StoreApi<T>;
    }
    return undefined;
}
