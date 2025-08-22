import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { Draft } from 'immer';
import type { ReactNode } from 'react';
import { reducer as tempIdMapReducer } from './reducers/tempIdMapReducer';

export type TempIdMapState = Record<string, string>;

type Action =
    | { type: 'SET_MAPPING'; tempId: string; realId: string }
    | { type: 'CLEAR_MAPPING'; tempId: string }
    | { type: 'CLEAR_ALL' };

const STORAGE_KEY = 'violet-kanban-tempidmap-storage';

// reducer lives in src/providers/reducers/tempIdMapReducer.ts

const TempIdMapContext = createContext<{
    state: TempIdMapState;
    setMapping: (tempId: string, realId: string) => void;
    getRealId: (tempId: string) => string | undefined;
    clearMapping: (tempId: string) => void;
    clearAll: () => void;
} | null>(null);

export function TempIdMapProvider({ children }: { children: ReactNode }) {
    let initial: TempIdMapState = {};
    try {
        if (typeof window !== 'undefined') {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) initial = JSON.parse(raw);
        }
    } catch (e) {
        initial = {};
    }
    const [state, dispatch] = useReducer(tempIdMapReducer as any, initial);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // ignore
        }
    }, [state]);

    const api = {
        state,
        setMapping: (tempId: string, realId: string) =>
            dispatch({ type: 'SET_MAPPING', tempId, realId }),
        getRealId: (tempId: string) => state[tempId],
        clearMapping: (tempId: string) =>
            dispatch({ type: 'CLEAR_MAPPING', tempId }),
        clearAll: () => dispatch({ type: 'CLEAR_ALL' }),
    };

    return (
        <TempIdMapContext.Provider value={api}>
            {children}
        </TempIdMapContext.Provider>
    );
}

export function useTempIdMap() {
    const ctx = useContext(TempIdMapContext);
    if (!ctx) throw new Error('useTempIdMap must be used within TempIdMapProvider');
    return ctx;
}
