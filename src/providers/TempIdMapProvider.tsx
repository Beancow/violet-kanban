'use client';
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import * as Sentry from '@/lib/sentryWrapper';
import { safeCaptureException } from '@/lib/sentryWrapper';
import type { ReactNode } from 'react';
import {
    reducer as tempIdMapReducer,
    TempIdMapAction as _TempIdMapAction,
} from './reducers/tempIdMapReducer';

export type TempIdMapState = Record<string, string>;
import type { TempIdMapApi } from '@/types/provider-apis';

const STORAGE_KEY = 'violet-kanban-tempidmap-storage';

// reducer lives in src/providers/reducers/tempIdMapReducer.ts

const TempIdMapContext = createContext<TempIdMapApi | null>(null);

export function TempIdMapProvider({ children }: { children: ReactNode }) {
    let initial: TempIdMapState = {};
    try {
        if (typeof window !== 'undefined') {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) initial = JSON.parse(raw);
        }
    } catch (e) {
        // Log parse errors when reading localStorage for debugging.
        console.error('[tempIdMap] failed to read from localStorage', e);
        safeCaptureException(e);
        initial = {};
    }
    const [state, dispatch] = useReducer(tempIdMapReducer, initial);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // Log write errors for diagnostics (e.g., storage quota exceeded)
            console.error('[tempIdMap] failed to write to localStorage', e);
            safeCaptureException(e);
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
    if (!ctx)
        throw new Error('useTempIdMap must be used within TempIdMapProvider');
    return ctx;
}
