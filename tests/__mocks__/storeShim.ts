// Minimal test shim for legacy `@/store/*` imports used by app components during tests.
// Aim: redirect store calls to the new provider adapters or no-op implementations so
// mounting `AppProvider` in tests doesn't cause the old zustand singletons to initialize.

export const useQueueStore = () => {
    // Lazy require to avoid cycles during module evaluation
    // Use the provider hook at runtime in tests (AppProvider must be mounted)
    // If provider isn't mounted, return a minimal API that throws on use.
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require('../src/providers/QueueProvider');
        return mod.useQueueStore();
    } catch (e) {
        throw new Error('useQueueStore called outside of provider in tests');
    }
};

export const useBoardStore = () => {
    try {
        const mod = require('../src/providers/BoardProvider');
        return mod.useBoardStore();
    } catch (e) {
        throw new Error('useBoardStore called outside of provider in tests');
    }
};

export const useListStore = () => {
    try {
        const mod = require('../src/providers/ListProvider');
        return mod.useListStore();
    } catch (e) {
        throw new Error('useListStore called outside of provider in tests');
    }
};

export const useCardStore = () => {
    try {
        const mod = require('../src/providers/CardProvider');
        return mod.useCardStore();
    } catch (e) {
        throw new Error('useCardStore called outside of provider in tests');
    }
};

export const getOrCreateQueueStore = () => {
    // provide a minimal object matching the legacy API used by SyncManager
    return {
        getState: () => ({
            boardActionQueue: [],
            listActionQueue: [],
            cardActionQueue: [],
        }),
    } as any;
};

export const getOrCreateAuthStore = () =>
    ({
        getState: () => ({ refreshIdToken: async () => {}, idToken: null }),
    } as any);
export const getOrCreateOrganizationStore = () =>
    ({ getState: () => ({ currentOrganizationId: null }) } as any);

// Fallbacks for other imports can be added as-needed by tests.
export default {};
