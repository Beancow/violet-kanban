'use client';
import React, {
    createContext,
    useContext,
    useEffect,
    useReducer,
    useState,
} from 'react';
import type { ReactNode } from 'react';
import type { SyncErrorApi, SyncError } from '@/types/provider-apis';
import * as RadixToast from '@radix-ui/react-toast';
import stylesToast from '@/components/Toast.module.css';
import { safeCaptureException } from '@/lib/sentryWrapper';
import { useToast } from './ToastProvider';
// dedupe keys will be built from actionType + message; no payload-id extraction

type State = { errors: SyncError[] };

type Action =
    | { type: 'ADD_ERROR'; err: SyncError }
    | { type: 'CLEAR_ERRORS' }
    | { type: 'POP_ERROR' };

const initialState: State = { errors: [] };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'ADD_ERROR': {
            // Build a dedupe key from payload id (if present), actionType, and message
            const makeKey = (e: SyncError) => {
                const typePart = e.actionType ? String(e.actionType) : '';
                return `${typePart}::${String(e.message)}`;
            };

            const newKey = makeKey(action.err);
            const existingIdx = state.errors.findIndex(
                (ex) => makeKey(ex) === newKey
            );
            if (existingIdx !== -1) {
                // Replace existing entry with the newer one
                const copy = [...state.errors];
                copy[existingIdx] = action.err;
                return { errors: copy };
            }
            return { errors: [...state.errors, action.err] };
        }
        case 'CLEAR_ERRORS':
            return { errors: [] };
        case 'POP_ERROR': {
            if (!state.errors || state.errors.length === 0) return state;
            return { errors: state.errors.slice(1) };
        }
        default:
            return state;
    }
}

const SyncErrorContext = createContext<SyncErrorApi | null>(null);

export function SyncErrorProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const toast = useToast();

    // When new errors appear in state.errors, enqueue a toast for each new
    // error and then pop it from the provider state. We keep the dedupe
    // behavior in the reducer, and make presentation best-effort.
    useEffect(() => {
        if (!state.errors || state.errors.length === 0) return;

        // Show the first error only to avoid flooding; the reducer dedupes
        // similar errors so repeated adds won't spam.
        const err = state.errors[0];
        try {
            toast.addToast({
                title: err.actionType ? String(err.actionType) : 'Sync error',
                description: err.message,
            });
        } catch (e) {
            safeCaptureException(e);
        }

        // remove it from provider state immediately; presentation is handled
        // by the ToastProvider.
        try {
            dispatch({ type: 'POP_ERROR' });
        } catch (e) {
            safeCaptureException(e);
        }
    }, [state.errors]);

    const api: SyncErrorApi = {
        errors: state.errors,
        addError: (err: SyncError) => dispatch({ type: 'ADD_ERROR', err }),
        clearErrors: () => dispatch({ type: 'CLEAR_ERRORS' }),
    };

    return (
        <SyncErrorContext.Provider value={api}>
            {children}
        </SyncErrorContext.Provider>
    );
}

export function useSyncErrorProvider() {
    const ctx = useContext(SyncErrorContext);
    if (!ctx)
        throw new Error(
            'useSyncErrorProvider must be used within SyncErrorProvider'
        );
    return ctx;
}

export default SyncErrorProvider;
