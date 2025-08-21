import { create, StoreApi, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Organization } from '@/types/appState.type';

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
): import('zustand').UseBoundStore<StoreApi<OrganizationState>> {
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
        );
    }
    return create<OrganizationState>()(creator);
}

let _organizationStore:
    | import('zustand').UseBoundStore<StoreApi<OrganizationState>>
    | null = null;
export function getOrCreateOrganizationStore(): import('zustand').UseBoundStore<
    StoreApi<OrganizationState>
> {
    if (!_organizationStore) {
        const persistEnabled = typeof window !== 'undefined';
        _organizationStore = createOrganizationStore(persistEnabled);
    }
    return _organizationStore;
}

export const useOrganizationStore = getOrCreateOrganizationStore();
