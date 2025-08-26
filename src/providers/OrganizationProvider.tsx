'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { Organization } from '@/types/appState.type';
import type { OrganizationApi } from '@/types/provider-apis';
import { useAuth } from '@/providers/AuthProvider';
import useFreshToken from '@/hooks/useFreshToken';

// A lightweight, simplified OrganizationProvider:
// - hydrates `currentOrganizationId` from localStorage on the client
// - does not auto-fetch organizations (consumers should call `refetchOrganizations`)
// - only persists when `setCurrentOrganizationId` is called

type OrganizationExtendedApi = OrganizationApi & { isHydrated: boolean };

const OrganizationContext = createContext<OrganizationExtendedApi | null>(null);

let _adapter: { getState: () => OrganizationExtendedApi } | null = null;

export function OrganizationProvider({ children }: { children: ReactNode }) {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentOrganizationId, setCurrentOrganizationIdState] = useState<
        string | null
    >(null);
    const [persistedOrgId, setPersistedOrgId] = useLocalStorage<string | null>(
        'currentOrganizationId',
        null
    );
    const [isHydrated, setIsHydrated] = useState(false);
    const auth = useAuth();
    const [refetchError, setRefetchError] = useState<string | null>(null);
    const getFreshToken = useFreshToken();

    // Hydrate from localStorage when the persisted value becomes available on client
    useEffect(() => {
        // persistedOrgId will be null during SSR and updated on client by the hook
        setIsHydrated(true);
        if (persistedOrgId) {
            setCurrentOrganizationIdState(persistedOrgId);
        }
        // we intentionally only depend on persistedOrgId here so hydration runs when it becomes available
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [persistedOrgId]);

    const api: OrganizationExtendedApi = {
        organizations,
        loading,
        currentOrganizationId,
        currentOrganization:
            organizations.find((o) => o.id === currentOrganizationId) ?? null,
        setCurrentOrganizationId: (id: string | null) => {
            setCurrentOrganizationIdState(id);
            try {
                setPersistedOrgId(id);
            } catch (e) {
                // ignore localStorage write failures
            }
        },
        setOrganizations: (orgs: Organization[]) => setOrganizations(orgs),
        setLoading: (l: boolean) => setLoading(l),
        refetchOrganizations: async () => {
            try {
                setLoading(true);
                const token = await getFreshToken();
                const res = await fetch('/api/orgs', {
                    method: 'GET',
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!res.ok) {
                    const body = await res.json().catch(() => null);
                    throw new Error(
                        body && body.error
                            ? String(body.error)
                            : `Failed to fetch organizations: ${res.status}`
                    );
                }
                const body = await res.json();
                if (body && body.success && Array.isArray(body.organizations)) {
                    setOrganizations(body.organizations);
                    setRefetchError(null);
                } else {
                    const msg = 'Unexpected response fetching organizations';
                    setRefetchError(msg);
                    throw new Error(msg);
                }
            } catch (e) {
                // keep loading false so callers can decide; log for diagnostics
                console.error(
                    '[OrganizationProvider] refetchOrganizations failed',
                    e
                );
            } finally {
                setLoading(false);
            }
        },
        refetchError,
        clearRefetchError: () => setRefetchError(null),
        isHydrated,
    } as OrganizationExtendedApi;

    // expose a tiny adapter used by legacy callers/tests
    _adapter = { getState: () => api };

    // One-time auto-fetch: when auth becomes available and provider is hydrated,
    // fetch organizations if we don't already have them. This keeps startup fetch
    // behavior simple and idempotent.
    useEffect(() => {
        if (!isHydrated) return;
        if (!auth.hasAuth) return;
        if (organizations.length > 0) return;
        // fire-and-forget; callers can also call refetchOrganizations manually
        void api.refetchOrganizations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHydrated, auth.hasAuth]);

    return (
        <OrganizationContext.Provider value={api}>
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganizationProvider() {
    const ctx = useContext(OrganizationContext);
    if (!ctx)
        throw new Error(
            'useOrganizationProvider must be used within OrganizationProvider'
        );
    return ctx;
}

export function getOrCreateOrganizationProvider() {
    if (!_adapter) {
        // Return a minimal shim until provider mounts
        return {
            getState: () =>
                ({
                    organizations: [],
                    loading: true,
                    currentOrganizationId: null,
                    currentOrganization: null,
                    setCurrentOrganizationId: () => undefined,
                    setOrganizations: () => undefined,
                    setLoading: () => undefined,
                    refetchOrganizations: async () => {},
                    isHydrated: false,
                } as OrganizationExtendedApi),
        };
    }
    return _adapter;
}

export default OrganizationProvider;
