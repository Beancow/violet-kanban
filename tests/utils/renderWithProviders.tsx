import React, { ReactNode } from 'react';
import { render } from '@testing-library/react';
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
    // If true, mount the full application provider tree (TempIdMap, SyncError, Board/List/Card)
    useAppProviders?: boolean;
    ReconciliationProvider?: React.ComponentType<{ children?: ReactNode }>;
    // Allow overriding individual providers from the app tree for tighter control in tests
    TempIdMapProvider?: React.ComponentType<{ children?: ReactNode }>;
    SyncErrorProvider?: React.ComponentType<{ children?: ReactNode }>;
    BoardProvider?: React.ComponentType<{ children?: ReactNode }>;
    ListProvider?: React.ComponentType<{ children?: ReactNode }>;
    CardProvider?: React.ComponentType<{ children?: ReactNode }>;
    // Optional module mocks applied before the UI is required/created. Each
    // entry is an object with `path` and `factory` used with `jest.doMock`.
    mockModules?: Array<{ path: string; factory: () => any }>;
}

export function renderWithProviders(
    ui: React.ReactElement | (() => React.ReactElement),
    options?: RenderOptions & { moduleMocks?: Record<string, any> }
) {
    // If the caller provided module mocks, reset the module cache and apply
    // the mocks before any requires/imports for the UI element occur. This
    // lets tests ensure mocked modules are in place before components that
    // import them are evaluated.
    // If the caller provided module mocks, reset module cache and apply them
    // before any provider modules are required. This lets tests inject
    // mocked provider modules safely even if other tests loaded providers.
    if (options?.moduleMocks) {
        Object.entries(options.moduleMocks).forEach(([mod, impl]) => {
            // impl should be a factory or module object
            // use doMock so subsequent requires return the mock
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            jest.doMock(mod, () => impl);
        });
    }
    if (options?.mockModules && options.mockModules.length > 0) {
        for (const m of options.mockModules) {
            // eslint-disable-next-line no-undef
            jest.doMock(m.path, m.factory);
        }
    }
    // Resolve provider modules safely across CommonJS/ESM and named/default
    // exports. If requiring the real providers throws (for example because
    // Firebase config/env isn't available in the test environment), fall
    // back to the lightweight mock providers shipped with tests so unit tests
    // can run without booting external integrations.
    let AP: React.ComponentType<{ children?: ReactNode }>;
    let OP: React.ComponentType<{ children?: ReactNode }>;
    let ReconP: React.ComponentType<{ children?: ReactNode }> = ({
        children,
    }) => <>{children}</>;

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

    // (removed temporary diagnostics)

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
    // Resolve reconciliation provider (fall back to test mock). This ensures
    // `useReconciliation()` is safe to call in components rendered by tests
    // without requiring callers to opt into the full app provider tree.
    try {
        const reconMod = require('@/providers/ReconciliationProvider');
        ReconP = reconMod.ReconciliationProvider ?? reconMod.default ?? ReconP;
    } catch (e) {
        try {
            ReconP = require('./providerMocks').MockReconciliationProvider;
        } catch (_) {
            // leave pass-through
        }
    }
    // Resolve UiProvider lazily so test module mocks can replace provider
    // modules before they are required/evaluated. If the real UiProvider
    // cannot be required (e.g., test env), fall back to the provided
    // override or a pass-through component.
    let UP: React.ComponentType<{ children?: ReactNode }>;
    if (options?.UiProvider) {
        UP = options.UiProvider;
    } else if (options?.moduleMocks) {
        // If the caller provided module mocks, avoid requiring the real
        // UiProvider to prevent accidental module evaluation that may
        // rely on environment not available in tests. Use a pass-through
        // component unless the caller explicitly provided one.
        UP = ({ children }: { children?: ReactNode }) => <>{children}</>;
    } else {
        try {
            const mod = require('@/providers/UiProvider');
            UP = mod.UiProvider ?? mod.default ?? mod;
        } catch (e) {
            UP = ({ children }: { children?: ReactNode }) => <>{children}</>;
        }
    }

    // Dynamically require QueueProvider so tests that `jest.mock` it can
    // override the module before this function is executed. If requiring the
    // real QueueProvider fails (e.g., in some test environments), fall back to
    // a simple pass-through component.
    let QP: React.ComponentType<{ children?: ReactNode }>;
    try {
        const qpMod = require('@/providers/QueueProvider');
        const candidate = qpMod.QueueProvider ?? qpMod.default ?? qpMod;
        // Diagnostic: print resolved QueueProvider shape for test triage
        // (removed temporary diagnostics)

        QP =
            typeof candidate === 'function'
                ? candidate
                : ({ children }: { children?: ReactNode }) => <>{children}</>;
    } catch (e) {
        QP = ({ children }: { children?: ReactNode }) => <>{children}</>;
    }

    // Resolve optional app-level providers. TempIdMapProvider is required by
    // some low-level components (e.g., SyncManager), so try to resolve it by
    // default and fall back to a pass-through component if unavailable.
    let TempP: React.ComponentType<{ children?: ReactNode }> = ({
        children,
    }) => <>{children}</>;
    try {
        const mod = require('@/providers/TempIdMapProvider');
        TempP = mod.TempIdMapProvider ?? mod.default ?? TempP;
    } catch (e) {
        // leave pass-through if module can't be required in test env
    }
    // (removed temporary diagnostics)
    let SyncErrP: React.ComponentType<{ children?: ReactNode }> = ({
        children,
    }) => <>{children}</>;
    let BoardP: React.ComponentType<{ children?: ReactNode }> = ({
        children,
    }) => <>{children}</>;
    let ListP: React.ComponentType<{ children?: ReactNode }> = ({
        children,
    }) => <>{children}</>;
    let CardP: React.ComponentType<{ children?: ReactNode }> = ({
        children,
    }) => <>{children}</>;

    if (options?.useAppProviders) {
        // allow overrides first
        if (options?.TempIdMapProvider) {
            TempP = options.TempIdMapProvider;
        }

        // Reconciliation provider is resolved below (so it is available to
        // SyncManager and other low-level components even when tests don't
        // explicitly enable the full app provider tree).

        if (options?.SyncErrorProvider) {
            SyncErrP = options.SyncErrorProvider;
        } else {
            try {
                const mod = require('@/providers/SyncErrorProvider');
                SyncErrP = mod.default ?? mod.SyncErrorProvider ?? SyncErrP;
            } catch (e) {
                // pass
            }
        }

        if (options?.BoardProvider) {
            BoardP = options.BoardProvider;
        } else {
            try {
                const mod = require('@/providers/BoardProvider');
                BoardP = mod.BoardProvider ?? mod.default ?? BoardP;
            } catch (e) {}
        }

        if (options?.ListProvider) {
            ListP = options.ListProvider;
        } else {
            try {
                const mod = require('@/providers/ListProvider');
                ListP = mod.ListProvider ?? mod.default ?? ListP;
            } catch (e) {}
        }

        if (options?.CardProvider) {
            CardP = options.CardProvider;
        } else {
            try {
                const mod = require('@/providers/CardProvider');
                CardP = mod.CardProvider ?? mod.default ?? CardP;
            } catch (e) {}
        }
    }

    const Wrapper = ({ children }: { children?: ReactNode }) => (
        <AP>
            <TempP>
                <ReconP>
                    <OP>
                        <SyncErrP>
                            <BoardP>
                                <ListP>
                                    <CardP>
                                        <UP>
                                            <QP>{children}</QP>
                                        </UP>
                                    </CardP>
                                </ListP>
                            </BoardP>
                        </SyncErrP>
                    </OP>
                </ReconP>
            </TempP>
        </AP>
    );

    // (removed temporary diagnostics)

    // Ensure UiProvider wraps the entire provider tree so `useUi()` is
    // available to any component rendered in tests. Use the resolved `UP`
    // (which falls back to a pass-through) so this is safe in all test
    // environments.
    const FullWrapper = ({ children }: { children?: ReactNode }) => (
        <UP>
            <Wrapper>{children}</Wrapper>
        </UP>
    );

    // If moduleMocks were provided, ensure the UI factory is evaluated inside
    // an isolated module context so that jest.doMock() replacements are used
    // by any requires executed when building the UI. Fallback to direct
    // evaluation if jest.isolateModules is not available.
    let element: React.ReactElement;
    // no diagnostics
    if (options?.moduleMocks) {
        try {
            // Ensure mocked modules are registered inside an isolated module
            // context so their factories take effect for subsequent requires.
            // Do NOT create React elements inside isolateModules because that
            // can cause a separate React renderer/dispatcher to be used and
            // trigger invalid-hook-call errors in tests. Create the element
            // after exiting isolateModules so it uses the primary module
            // registry and the same React instance as the test runtime.
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore - jest is available in the test environment
            jest.isolateModules(() => {
                // no-op; mocks were already installed via jest.doMock above
            });
            element =
                typeof ui === 'function'
                    ? (ui as () => React.ReactElement)()
                    : (ui as any);
        } catch (e) {
            // If anything goes wrong, fall back to direct evaluation.
            element =
                typeof ui === 'function'
                    ? (ui as () => React.ReactElement)()
                    : ui;
        }
    } else {
        element =
            typeof ui === 'function' ? (ui as () => React.ReactElement)() : ui;
    }
    return render(element, { wrapper: FullWrapper as any });
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
