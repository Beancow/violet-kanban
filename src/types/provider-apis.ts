import type { Organization, AuthUser } from './appState.type';
import type { SyncAction } from './worker.type';
import type { AuthContextType } from '@/providers/AuthProvider';

export type OrganizationApi = {
    organizations: Organization[];
    loading: boolean;
    currentOrganizationId: string | null;
    currentOrganization: Organization | null;
    setCurrentOrganizationId: (id: string | null) => void;
    setOrganizations: (orgs: Organization[]) => void;
    setLoading: (loading: boolean) => void;
    refetchOrganizations: () => Promise<void>;
};

// AuthApi mirrors the runtime auth provider surface. We prefer deriving it
// from the actual `AuthContextType` exported by the provider so tests and
// consumers stay in sync if the provider changes its internal types
// (for example switching to Firebase's User type). Additional helper fields
// used by other parts of the app (idToken, loginWithPopup, refreshIdToken)
// are added here to preserve the expected API surface.
export type AuthApi = AuthContextType;

// Extract payload union type from SyncAction for safer error payload typing
export type SyncActionPayload = SyncAction extends { payload: infer P }
    ? P
    : never;

export type SyncError = {
    timestamp: number;
    message: string;
    actionType?: string;
    payload?: SyncActionPayload | Record<string, unknown>;
};

export type SyncErrorApi = {
    errors: SyncError[];
    addError: (err: SyncError) => void;
    clearErrors: () => void;
};

export type UiApi = {
    openModal: { name: string | null; props?: Record<string, unknown> | null };
    open: (name: string, props?: Record<string, unknown>) => void;
    close: () => void;
    toggle: (name: string, props?: Record<string, unknown>) => void;
};

export default {};
