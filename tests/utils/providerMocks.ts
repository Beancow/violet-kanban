import React from 'react';
import type { AuthApi, OrganizationApi } from '@/types/provider-apis';

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
    const api: AuthApi = {
        authUser: seed?.authUser ?? null,
        idToken: seed?.idToken ?? null,
        loading: seed?.loading ?? false,
        loginWithPopup: seed?.loginWithPopup ?? (async () => {}),
        logout: seed?.logout ?? (async () => {}),
        refreshIdToken: seed?.refreshIdToken ?? (async () => {}),
    };

    // Export a module that defaults to a provider component (pass-through)
    // and also export the seeded api for direct imports if tests need it.
    return {
        __esModule: true,
        default: MockAuthProvider,
        AuthProvider: MockAuthProvider,
        useAuthProvider: () => api,
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
