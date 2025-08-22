import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';

type SyncError = {
    timestamp: number;
    message: string;
    actionType?: string;
    payload?: unknown;
};

type SyncErrorApi = {
    errors: SyncError[];
    addError: (err: SyncError) => void;
    clearErrors: () => void;
};

type State = { errors: SyncError[] };

type Action = { type: 'ADD_ERROR'; err: SyncError } | { type: 'CLEAR_ERRORS' };

const initialState: State = { errors: [] };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'ADD_ERROR':
            return { errors: [...state.errors, action.err] };
        case 'CLEAR_ERRORS':
            return { errors: [] };
        default:
            return state;
    }
}

const SyncErrorContext = createContext<SyncErrorApi | null>(null);

export function SyncErrorProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const api: SyncErrorApi = {
        errors: state.errors,
        addError: (err: SyncError) => dispatch({ type: 'ADD_ERROR', err }),
        clearErrors: () => dispatch({ type: 'CLEAR_ERRORS' }),
    };

    return <SyncErrorContext.Provider value={api}>{children}</SyncErrorContext.Provider>;
}

export function useSyncErrorProvider() {
    const ctx = useContext(SyncErrorContext);
    if (!ctx) throw new Error('useSyncErrorProvider must be used within SyncErrorProvider');
    return ctx;
}

export default SyncErrorProvider;
