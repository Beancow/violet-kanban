'use client';
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '@/types/appState.type';
import type { AuthApi } from '@/types/provider-apis';

type AuthState = AuthApi;

type Action =
    | { type: 'SET_USER'; user: AuthUser | null }
    | { type: 'SET_TOKEN'; token: string | null }
    | { type: 'SET_LOADING'; loading: boolean };

const initialState: AuthState = {
    authUser: null,
    idToken: null,
    loading: false,
    loginWithPopup: async () => {},
    logout: async () => {},
    refreshIdToken: async () => {},
};

function reducer(state: AuthState, action: Action): AuthState {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, authUser: action.user };
        case 'SET_TOKEN':
            return { ...state, idToken: action.token };
        case 'SET_LOADING':
            return { ...state, loading: action.loading };
        default:
            return state;
    }
}

const AuthContext = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Placeholder implementations — these should be wired to your auth system elsewhere.
    // Providers expose the same API shape as before so consumers won't need changes.
    const api: AuthApi = {
        authUser: state.authUser,
        idToken: state.idToken,
        loading: state.loading,
        loginWithPopup: async () => {
            dispatch({ type: 'SET_LOADING', loading: true });
            try {
                // no-op placeholder
            } finally {
                dispatch({ type: 'SET_LOADING', loading: false });
            }
        },
        logout: async () => {
            dispatch({ type: 'SET_LOADING', loading: true });
            try {
                // no-op
                dispatch({ type: 'SET_USER', user: null });
                dispatch({ type: 'SET_TOKEN', token: null });
            } finally {
                dispatch({ type: 'SET_LOADING', loading: false });
            }
        },
        refreshIdToken: async () => {
            // no-op placeholder
        },
    };

    // Keep effect slot for future auth integration (e.g., firebase onAuthStateChanged)
    useEffect(() => {
        // intentionally left blank; integration hooks may dispatch updates into reducer
        return () => {};
    }, []);

    return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuthProvider() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuthProvider must be used within AuthProvider');
    return ctx;
}

export default AuthProvider;
