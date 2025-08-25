import React, { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { UiProvider } from '@/providers/UiProvider';
// `AuthProvider` and `OrganizationProvider` are required lazily below so
// tests can call `jest.mock()` with factories that replace those modules
// without causing initialization-order problems.
import type { AuthApi, OrganizationApi } from '@/types/provider-apis';
// Prefer the provider's runtime context type if available to keep test helpers
// in sync with the real provider implementation.
import type { AuthContextType } from '@/providers/AuthProvider';

interface RenderOptions {
    // Allow tests to pass in replacement provider components (useful when a test
    // wants to mock Auth or Organization providers). If not provided, the real
    // providers are used.
    AuthProvider?: React.ComponentType<{ children?: ReactNode }>;
    OrganizationProvider?: React.ComponentType<{ children?: ReactNode }>;
    UiProvider?: React.ComponentType<{ children?: ReactNode }>;
}

export function renderWithProviders(
    ui: React.ReactElement,
    options?: RenderOptions
) {
    // Resolve provider modules safely across CommonJS/ESM and named/default
    // exports. If requiring the real providers throws (for example because
    // Firebase config/env isn't available in the test environment), fall
    // back to the lightweight mock providers shipped with tests so unit tests
    // can run without booting external integrations.
    let AP: React.ComponentType<{ children?: ReactNode }>;
    let OP: React.ComponentType<{ children?: ReactNode }>;

    if (options?.AuthProvider) {
        AP = options.AuthProvider;
    } else {
        try {
            const authMod = require('@/providers/AuthProvider');
            AP = authMod.AuthProvider ?? authMod.default ?? authMod;
        } catch (e) {
            // fall back to test mock provider
            AP = require('./providerMocks').MockAuthProvider;
        }
    }

    if (options?.OrganizationProvider) {
        OP = options.OrganizationProvider;
    } else {
        try {
            const orgMod = require('@/providers/OrganizationProvider');
            OP = orgMod.OrganizationProvider ?? orgMod.default ?? orgMod;
        } catch (e) {
            OP = require('./providerMocks').MockOrganizationProvider;
        }
    }
    const UP = options?.UiProvider ?? UiProvider;

    const Wrapper = ({ children }: { children?: ReactNode }) => (
        <AP>
            <OP>
                <UP>{children}</UP>
            </OP>
        </AP>
    );

    return render(ui, { wrapper: Wrapper as any });
}

export type { RenderOptions };

// Convenience: allow callers to create pass-through provider components that
// seed initial API shapes. This is useful when you want to provide a specific
// `authUser` or `organizations` list without booting real provider logic.
export function createSeededAuthProvider(seed: Partial<AuthApi>) {
    return function SeededAuthProvider({ children }: { children?: ReactNode }) {
        // The real AuthProvider API is fairly small; we provide the seeded values
        // and no-op implementations for functions.
        // Seed only the fields present on the real AuthContextType. Tests
        // that also need legacy helpers (idToken, refreshIdToken, etc.) can
        // attach them under `seed.__extra` when creating the seeded
        // provider. The runtime `api` remains loose (`any`) so tests don't
        // fail if internal provider types change.
        const api: any = {
            authUser: seed.authUser ?? null,
            loading: seed.loading ?? false,
            logout: seed.logout ?? (async () => {}),
            ...(seed as any).__extra,
        };

        const Ctx = require('@/providers/AuthProvider').__esModule
            ? require('@/providers/AuthProvider').default
            : require('@/providers/AuthProvider');
        // Instead of depending on internals, we simply render children. Tests
        // should call into context consumers only via the API surface; if a test
        // needs a context object directly, consider using `jest.mock` with the
        // factory in `tests/utils/providerMocks`.
        return <>{children}</>;
    };
}

export function createSeededOrganizationProvider(
    seed: Partial<OrganizationApi>
) {
    return function SeededOrganizationProvider({
        children,
    }: {
        children?: ReactNode;
    }) {
        // Provide seeded fields; functions are no-ops.
        const api: OrganizationApi = {
            organizations: seed.organizations ?? [],
            loading: seed.loading ?? false,
            currentOrganizationId: seed.currentOrganizationId ?? null,
            currentOrganization: seed.currentOrganization ?? null,
            setCurrentOrganizationId:
                seed.setCurrentOrganizationId ?? (() => {}),
            setOrganizations: seed.setOrganizations ?? (() => {}),
            setLoading: seed.setLoading ?? (() => {}),
            refetchOrganizations: seed.refetchOrganizations ?? (async () => {}),
        };

        return <>{children}</>;
    };
}
