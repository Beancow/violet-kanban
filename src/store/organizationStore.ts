import { create, StoreApi, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Organization } from '@/types/appState.type';
import { isUseBoundStore } from './factoryHelpers';

interface OrganizationState {
    organizations: Organization[];
    loading: boolean;
    currentOrganizationId: string | null;
    currentOrganization: Organization | null;
    setCurrentOrganizationId: (id: string | null) => void;
    setOrganizations: (orgs: Organization[]) => void;
    setLoading: (loading: boolean) => void;
    refetchOrganizations: () => Promise<void>;
}

export function createOrganizationStore(
    persistEnabled = true
): import('zustand').StoreApi<OrganizationState> {
    const creator: StateCreator<OrganizationState> = (set, get) => ({
        organizations: [],
        loading: true,
        currentOrganizationId: null,
        currentOrganization: null,
        setCurrentOrganizationId: (id: string | null) => {
            set((state: OrganizationState) => ({
                currentOrganizationId: id,
                currentOrganization:
                    state.organizations.find((o) => o.id === id) || null,
            }));
        },
        setOrganizations: (orgs: Organization[]) => {
            set((state: OrganizationState) => ({
                organizations: orgs,
                currentOrganizationId:
                    !state.currentOrganizationId ||
                    !orgs.find((o) => o.id === state.currentOrganizationId)
                        ? orgs[0]?.id || null
                        : state.currentOrganizationId,
                currentOrganization:
                    orgs.find(
                        (o) =>
                            o.id ===
                            (get().currentOrganizationId || orgs[0]?.id)
                    ) || null,
            }));
        },
        setLoading: (loading: boolean) => set({ loading }),
        refetchOrganizations: async () => {
            set({ loading: true });
            try {
                const res = await fetch('/api/orgs', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (res.ok) {
                    const data = await res.json();
                    get().setOrganizations(data.organizations || []);
                } else {
                    set({ organizations: [] });
                }
            } catch (err) {
                set({ organizations: [] });
            } finally {
                set({ loading: false });
            }
        },
    });

    if (persistEnabled) {
        return create<OrganizationState>()(
            persist(creator, { name: 'violet-kanban-organization-storage' })
        ) as unknown as StoreApi<OrganizationState>;
    }
    return create<OrganizationState>()(
        creator
    ) as unknown as StoreApi<OrganizationState>;
}

let _organizationStore: StoreApi<OrganizationState> | null = null;

export function initializeOrganizationStore(
    persistEnabled = typeof window !== 'undefined'
) {
    if (!_organizationStore) {
        _organizationStore = createOrganizationStore(persistEnabled);
    }
    return _organizationStore;
}

export function getOrganizationStoreIfReady(): StoreApi<OrganizationState> | null {
    return _organizationStore;
}

export function getOrCreateOrganizationStore(): StoreApi<OrganizationState> {
    if (!_organizationStore) {
        throw new Error(
            'Organization store not initialized. Call initializeOrganizationStore() from OrganizationStoreProvider before using non-React APIs.'
        );
    }
    return _organizationStore;
}

export function createOrganizationStoreForTest() {
    return createOrganizationStore(false);
}

// Lazy UseBoundStore wrapper for components. Mirrors the pattern used by other stores so
// non-React code can call `getOrCreateOrganizationStore()` and React components can call `useOrganizationStore`.
export const useOrganizationStore: import('zustand').UseBoundStore<
    StoreApi<OrganizationState>
> = ((...args: Array<unknown>) => {
    const store = getOrCreateOrganizationStore();
    if (isUseBoundStore<OrganizationState>(store)) {
        const selector = (args.length > 0 ? args[0] : undefined) as
            | ((s: OrganizationState) => unknown)
            | undefined;
        return (
            store as unknown as (
                selector?: (s: OrganizationState) => unknown
            ) => unknown
        )(selector);
    }
    const selector = args[0] as unknown;
    const storeApi = store as StoreApi<OrganizationState>;
    if (typeof selector === 'function') {
        return (selector as (s: OrganizationState) => unknown)(
            storeApi.getState()
        );
    }
    return storeApi.getState();
}) as unknown as import('zustand').UseBoundStore<StoreApi<OrganizationState>>;
