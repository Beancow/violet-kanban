import type { Organization } from './appState.type';
import type { SyncAction } from './worker.type';
import type { User as FirebaseUser } from 'firebase/auth';

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

// AuthApi: runtime shape of the AuthProvider public surface. Keep this small
// and stable - tests and other providers should depend on this type instead
// of provider internals.
export type AuthApi = {
    // Real firebase auth user when available; null when not signed in.
    authUser: FirebaseUser | null;
    loading: boolean;
    logout: () => Promise<void>;
    idToken?: string | null;
    refreshIdToken?: () => Promise<string | null>;
    hasAuth: boolean;
    storedUser: {
        uid?: string;
        displayName?: string | null;
        email?: string | null;
    } | null;
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

// Public provider API types for other providers
export type TempIdMapApi = {
    state: Record<string, string>;
    setMapping: (tempId: string, realId: string) => void;
    getRealId: (tempId: string) => string | undefined;
    clearMapping: (tempId: string) => void;
    clearAll: () => void;
};

export type BoardApi = {
    state: { boards: import('./appState.type').Board[] };
    addBoard: (board: import('./appState.type').Board) => void;
    updateBoard: (
        board: Partial<import('./appState.type').Board> & { id: string }
    ) => void;
    removeBoard: (boardId: string) => void;
};

export type ListApi = {
    state: { lists: import('./appState.type').BoardList[] };
    addList: (list: import('./appState.type').BoardList) => void;
    updateList: (
        list: Partial<import('./appState.type').BoardList> & { id: string }
    ) => void;
    removeList: (listId: string) => void;
};

export type CardApi = {
    state: {
        cards: import('./appState.type').BoardCard[];
        orphanedCards?: import('./appState.type').BoardCard[];
    };
    addCard: (card: import('./appState.type').BoardCard) => void;
    updateCard: (
        card: Partial<import('./appState.type').BoardCard> & { id: string }
    ) => void;
    removeCard: (cardId: string) => void;
    markCardOrphaned: (cardId: string) => void;
};

export type QueueApi = {
    state: import('./state-shapes').QueueStateShape;
    enqueueBoardAction: (
        a: import('./violet-kanban-action').VioletKanbanAction
    ) => void;
    enqueueListAction: (
        a: import('./violet-kanban-action').VioletKanbanAction
    ) => void;
    enqueueCardAction: (
        a: import('./violet-kanban-action').VioletKanbanAction
    ) => void;
    enqueueOrgAction?: (
        a: import('./violet-kanban-action').VioletKanbanAction
    ) => void;
    requeueOrgAction?: (
        id: string,
        metaPatch:
            | Partial<import('./violet-kanban-action').QueueMeta>
            | import('./violet-kanban-action').QueueMeta
    ) => void;
    removeBoardAction: (id: string) => void;
    removeListAction: (id: string) => void;
    removeCardAction: (id: string) => void;
    removeOrgAction?: (id: string) => void;
};

export default {};
