import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { Organization } from '@/types/appState.type';

type OrganizationApi = {
    organizations: Organization[];
    loading: boolean;
    currentOrganizationId: string | null;
    currentOrganization: Organization | null;
    setCurrentOrganizationId: (id: string | null) => void;
    setOrganizations: (orgs: Organization[]) => void;
    setLoading: (loading: boolean) => void;
    refetchOrganizations: () => Promise<void>;
};

type State = {
    organizations: Organization[];
    loading: boolean;
    currentOrganizationId: string | null;
};

type Action =
    | { type: 'SET_ORGANIZATIONS'; orgs: Organization[] }
    | { type: 'SET_LOADING'; loading: boolean }
    | { type: 'SET_CURRENT_ORG_ID'; id: string | null };

const initialState: State = {
    organizations: [],
    loading: true,
    currentOrganizationId: null,
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_ORGANIZATIONS':
            return { ...state, organizations: action.orgs };
        case 'SET_LOADING':
            return { ...state, loading: action.loading };
        case 'SET_CURRENT_ORG_ID':
            return { ...state, currentOrganizationId: action.id };
        default:
            return state;
    }
}

const OrganizationContext = createContext<OrganizationApi | null>(null);

let _adapter: { getState: () => OrganizationApi } | null = null;

export function OrganizationProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const api: OrganizationApi = {
        organizations: state.organizations,
        loading: state.loading,
        currentOrganizationId: state.currentOrganizationId,
        currentOrganization: state.organizations.find((o) => o.id === state.currentOrganizationId) ?? null,
        setCurrentOrganizationId: (id: string | null) => dispatch({ type: 'SET_CURRENT_ORG_ID', id }),
        setOrganizations: (orgs: Organization[]) => dispatch({ type: 'SET_ORGANIZATIONS', orgs }),
        setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', loading }),
        refetchOrganizations: async () => {
            // Placeholder: consumers can call and providers can wire fetching into reducer
            return;
        },
    };

    // Keep a lightweight adapter that exposes current API; this mirrors the old getOrCreateOrganizationStore API surface
    _adapter = { getState: () => api };

    return <OrganizationContext.Provider value={api}>{children}</OrganizationContext.Provider>;
}

export function useOrganizationProvider() {
    const ctx = useContext(OrganizationContext);
    if (!ctx) throw new Error('useOrganizationProvider must be used within OrganizationProvider');
    return ctx;
}

export function getOrCreateOrganizationProviderStore() {
    if (!_adapter) {
        // Return a minimal shim until provider mounts
        return { getState: () => ({
            organizations: [],
            loading: true,
            currentOrganizationId: null,
            currentOrganization: null,
            setCurrentOrganizationId: () => undefined,
            setOrganizations: () => undefined,
            setLoading: () => undefined,
            refetchOrganizations: async () => {},
        } as OrganizationApi) };
    }
    return _adapter;
}

export default OrganizationProvider;
