import { create } from 'zustand';
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

export const useOrganizationStore = create<OrganizationState>()(
    persist(
        (set, get) => ({
            organizations: [],
            loading: true,
            currentOrganizationId: null,
            currentOrganization: null,
            setCurrentOrganizationId: (id) => {
                set((state) => ({
                    currentOrganizationId: id,
                    currentOrganization:
                        state.organizations.find((o) => o.id === id) || null,
                }));
            },
            setOrganizations: (orgs) => {
                set((state) => ({
                    organizations: orgs,
                    // If no org selected or selected org not found, pick first
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
            setLoading: (loading) => set({ loading }),
            refetchOrganizations: async () => {
                set({ loading: true });
                try {
                    // TODO: Replace with actual auth logic
                    const res = await fetch('/api/orgs', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            // Authorization: `Bearer ${idToken}`,
                        },
                    });
                    if (res.ok) {
                        const data = await res.json();
                        get().setOrganizations(data.organizations || []);
                    } else {
                        // Handle error
                        set({ organizations: [] });
                    }
                } catch (err) {
                    set({ organizations: [] });
                } finally {
                    set({ loading: false });
                }
            },
        }),
        { name: 'violet-kanban-organization-storage' }
    )
);
