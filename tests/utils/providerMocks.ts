import React from 'react';
import type { AuthApi, OrganizationApi } from '@/types/provider-apis';
import type { AuthContextType } from '@/providers/AuthProvider';

// Lightweight mocked provider components that simply render children. Tests
// can pass a seeded API to `mockAuthProvider(seed)` and use it in a
// `jest.mock` factory so consumers that import the provider module will
// receive the seeded API.

export const MockAuthProvider = ({
    children,
}: {
    children?: React.ReactNode;
}) => {
    return React.createElement(React.Fragment, null, children);
};

export const MockOrganizationProvider = ({
    children,
}: {
    children?: React.ReactNode;
}) => {
    return React.createElement(React.Fragment, null, children);
};

export function mockAuthProvider(seed?: Partial<AuthApi>) {
    // Build a loose runtime object using only the fields available on the
    // real AuthContextType. Tests that need extra helpers (idToken,
    // refreshIdToken, etc.) should provide them via `createSeededAuthProvider`
    // or by mocking the provider module directly.
    const api: any = {
        authUser: seed?.authUser ?? null,
        loading: seed?.loading ?? false,
        logout: seed?.logout ?? (async () => {}),
    };

    // Export a module that defaults to a provider component (pass-through)
    // and also export the seeded api for direct imports if tests need it.
    return {
        __esModule: true,
        default: MockAuthProvider,
        AuthProvider: MockAuthProvider,
        useAuth: () => api,
        __seededApi: api,
    } as any;
}

// Typed helper for tests that need to seed tokens or token-refresh behavior.
export type TestAuthSeed = Partial<AuthApi> & {
    // Optional current id token value to expose on the mocked API
    idToken?: string | null;
    // Optional implementation of a refresh function returning a fresh token
    refreshIdToken?: () => Promise<string | null>;
};

export function mockAuthProviderWithToken(seed?: TestAuthSeed) {
    const api: any = {
        authUser: seed?.authUser ?? null,
        loading: seed?.loading ?? false,
        logout: seed?.logout ?? (async () => {}),
        // include seeded token fields if provided
        ...(seed && seed.idToken !== undefined
            ? { idToken: seed.idToken }
            : {}),
        ...(seed && seed.refreshIdToken
            ? { refreshIdToken: seed.refreshIdToken }
            : {}),
    };

    return {
        __esModule: true,
        default: MockAuthProvider,
        AuthProvider: MockAuthProvider,
        useAuth: () => api,
        __seededApi: api,
    } as any;
}

export function mockOrganizationProvider(seed?: Partial<OrganizationApi>) {
    const api: OrganizationApi = {
        organizations: seed?.organizations ?? [],
        loading: seed?.loading ?? false,
        currentOrganizationId: seed?.currentOrganizationId ?? null,
        currentOrganization: seed?.currentOrganization ?? null,
        setCurrentOrganizationId: seed?.setCurrentOrganizationId ?? (() => {}),
        setOrganizations: seed?.setOrganizations ?? (() => {}),
        setLoading: seed?.setLoading ?? (() => {}),
        refetchOrganizations: seed?.refetchOrganizations ?? (async () => {}),
    };

    return {
        __esModule: true,
        default: MockOrganizationProvider,
        OrganizationProvider: MockOrganizationProvider,
        useOrganizationProvider: () => api,
        __seededApi: api,
    } as any;
}
