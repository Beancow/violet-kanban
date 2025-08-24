'use client';
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import * as Sentry from '@/lib/sentryWrapper';
import type { ReactNode } from 'react';
import { reducer as listReducer } from './reducers/listReducer';
import { registerListAdapter } from './adapter';
import type { BoardList } from '../types/appState.type';

type State = {
    lists: BoardList[];
};

type _Action =
    | { type: 'ADD_LIST'; list: BoardList }
    | { type: 'UPDATE_LIST'; list: Partial<BoardList> & { id: string } }
    | { type: 'REMOVE_LIST'; listId: string }
    | { type: 'SET_LISTS'; lists: BoardList[] };

const STORAGE_KEY = 'violet-kanban-list-storage';

const ListContext = createContext<{
    state: State;
    addList: (list: BoardList) => void;
    updateList: (list: Partial<BoardList> & { id: string }) => void;
    removeList: (listId: string) => void;
} | null>(null);

export function ListProvider({ children }: { children: ReactNode }) {
    let initial: State = { lists: [] };
    try {
        if (typeof window !== 'undefined') {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) initial = JSON.parse(raw) as State;
        }
    } catch (e) {
        // Log parse/read errors when hydrating lists from localStorage.
        console.error('[list] failed to read from localStorage', e);
        try {
            Sentry.captureException(e);
        } catch {
            /* ignore */
        }
        initial = { lists: [] };
    }

    const [state, dispatch] = useReducer(listReducer, initial);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // Log write errors for diagnostics (e.g., storage quota exceeded)
            console.error('[list] failed to write to localStorage', e);
            try {
                Sentry.captureException(e);
            } catch {
                /* ignore */
            }
        }
    }, [state]);

    const api = {
        state,
        addList: (list: BoardList) => dispatch({ type: 'ADD_LIST', list }),
        updateList: (list: Partial<BoardList> & { id: string }) =>
            dispatch({ type: 'UPDATE_LIST', list }),
        removeList: (listId: string) =>
            dispatch({ type: 'REMOVE_LIST', listId }),
    };

    useEffect(() => {
        registerListAdapter({
            addList: api.addList,
            updateList: api.updateList,
            removeList: api.removeList,
        });
        return () => registerListAdapter(null);
    }, [state]);

    return <ListContext.Provider value={api}>{children}</ListContext.Provider>;
}

export function useLists() {
    const ctx = useContext(ListContext);
    if (!ctx) throw new Error('useLists must be used within ListProvider');
    return ctx;
}

// reducer lives in src/providers/reducers/listReducer.ts
