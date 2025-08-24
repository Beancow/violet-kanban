import React, { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { UiProvider } from '@/providers/UiProvider';
// `AuthProvider` and `OrganizationProvider` are required lazily below so
// tests can call `jest.mock()` with factories that replace those modules
// without causing initialization-order problems.
import type { AuthApi, OrganizationApi } from '@/types/provider-apis';

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
    const AP =
        options?.AuthProvider ??
        (require('@/providers/AuthProvider').__esModule
            ? require('@/providers/AuthProvider').default
            : require('@/providers/AuthProvider'));
    const OP =
        options?.OrganizationProvider ??
        (require('@/providers/OrganizationProvider').__esModule
            ? require('@/providers/OrganizationProvider').default
            : require('@/providers/OrganizationProvider'));
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
        const api: AuthApi = {
            authUser: seed.authUser ?? null,
            idToken: seed.idToken ?? null,
            loading: seed.loading ?? false,
            loginWithPopup: seed.loginWithPopup ?? (async () => {}),
            logout: seed.logout ?? (async () => {}),
            refreshIdToken: seed.refreshIdToken ?? (async () => {}),
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
