import type { Organization, AuthUser } from './appState.type';
import type { SyncAction } from './worker.type';

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

export type AuthApi = {
    authUser: AuthUser | null;
    idToken: string | null;
    loading: boolean;
    loginWithPopup: () => Promise<void> | void;
    logout: () => Promise<void> | void;
    refreshIdToken: () => Promise<void>;
};

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
