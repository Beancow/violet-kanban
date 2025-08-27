'use client';
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { safeCaptureException } from '@/lib/sentryWrapper';
import type { ReactNode } from 'react';
import { reducer as tempIdMapReducer } from './reducers/tempIdMapReducer';

export type TempIdMapState = Record<string, string>;
import type { TempIdMapApi } from '@/types/provider-apis';
import { emitEvent, onEvent } from '@/utils/eventBusClient';

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
        // Direct write APIs removed. Producers should emit
        // 'tempid:set-request' / 'tempid:clear-request' on the eventBus.
        getRealId: (tempId: string) => state[tempId],
        clearAll: () => dispatch({ type: 'CLEAR_ALL' }),
    } as const;

    // Listen for request-style events so non-React producers can ask the
    // provider to perform mapping writes. The provider will perform the
    // reducer dispatch and then emit the same established events so
    // consumers remain informed.
    React.useEffect(() => {
        const offSetReq = onEvent(
            'tempid:set-request',
            (p: { tempId?: string; realId?: string } | any) => {
                try {
                    const tempId =
                        p && typeof p.tempId === 'string' && p.tempId;
                    const realId =
                        p && typeof p.realId === 'string' && p.realId;
                    if (tempId && realId) {
                        dispatch({ type: 'SET_MAPPING', tempId, realId });
                        emitEvent('tempid:set', { tempId, realId } as any);
                    }
                } catch {}
            }
        );

        const offClearReq = onEvent(
            'tempid:clear-request',
            (p: { tempId?: string } | any) => {
                try {
                    const tempId =
                        p && typeof p.tempId === 'string' && p.tempId;
                    if (tempId) {
                        dispatch({ type: 'CLEAR_MAPPING', tempId });
                        emitEvent('tempid:cleared', { tempId } as any);
                    }
                } catch {}
            }
        );

        return () => {
            try {
                if (typeof offSetReq === 'function') offSetReq();
                if (typeof offClearReq === 'function') offClearReq();
            } catch (_) {}
        };
    }, []);

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
