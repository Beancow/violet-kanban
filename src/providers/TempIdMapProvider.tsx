'use client';
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { safeCaptureException } from '@/lib/sentryWrapper';
import type { ReactNode } from 'react';
import { reducer as tempIdMapReducer } from './reducers/tempIdMapReducer';
import TempIdMapStore from '@/stores/TempIdMapStore';

export type TempIdMapState = Record<string, string>;
import type { TempIdMapApi } from '@/types/provider-apis';
import { emitEvent, onEvent } from '@/utils/eventBusClient';

const STORAGE_KEY = 'violet-kanban-tempidmap-storage';

// reducer lives in src/providers/reducers/tempIdMapReducer.ts

const TempIdMapContext = createContext<TempIdMapApi | null>(null);

export function TempIdMapProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(tempIdMapReducer, {});

    // Hydrate from IDB on mount. This ensures the provider is canonical and
    // that non-React producers may request writes which the provider will
    // persist in IDB.
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const keys = await TempIdMapStore.getAllKeys?.();
                // TempIdMapStore may not implement getAllKeys; fallback to existing
                // localStorage-based hydratation when absent.
                if (keys && Array.isArray(keys)) {
                    const loaded: Record<string, string> = {};
                    for (const k of keys) {
                        const real = await TempIdMapStore.getRealId(k);
                        if (real) loaded[k] = real;
                    }
                    if (mounted) {
                        // Replace state via CLEAR_ALL then SET_MAPPING for each
                        // entry so reducer keeps history manageable.
                        dispatch({ type: 'CLEAR_ALL' });
                        for (const [t, r] of Object.entries(loaded)) {
                            dispatch({
                                type: 'SET_MAPPING',
                                tempId: t,
                                realId: r,
                            });
                        }
                    }
                } else if (typeof window !== 'undefined') {
                    // Fallback: hydrate from localStorage for older installs.
                    try {
                        const raw = window.localStorage.getItem(STORAGE_KEY);
                        if (raw) {
                            const parsed = JSON.parse(raw || '{}');
                            dispatch({ type: 'CLEAR_ALL' });
                            Object.entries(parsed).forEach(([t, r]) => {
                                if (
                                    typeof t === 'string' &&
                                    typeof r === 'string'
                                ) {
                                    dispatch({
                                        type: 'SET_MAPPING',
                                        tempId: t,
                                        realId: r,
                                    });
                                }
                            });
                        }
                    } catch (e) {
                        console.error(
                            '[tempIdMap] localStorage hydrate failed',
                            e
                        );
                    }
                }
            } catch (e) {
                console.error('[TempIdMapProvider] hydrate failed', e);
                safeCaptureException(e as Error);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    // Keep a best-effort localStorage mirror so older code paths depending on
    // the storage key continue to work. This runs after state changes.
    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            }
        } catch (e) {
            console.error('[tempIdMap] failed to write to localStorage', e);
            safeCaptureException(e as Error);
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
                        // Persist canonical mapping to IDB first.
                        (async () => {
                            try {
                                await TempIdMapStore.put(tempId, realId);
                            } catch (e) {
                                safeCaptureException(e as Error);
                            }
                        })();

                        dispatch({ type: 'SET_MAPPING', tempId, realId });
                        emitEvent('tempid:set', { tempId, realId } as any);
                    }
                } catch (e) {
                    safeCaptureException(e as Error);
                }
            }
        );

        const offClearReq = onEvent(
            'tempid:clear-request',
            (p: { tempId?: string } | any) => {
                try {
                    const tempId =
                        p && typeof p.tempId === 'string' && p.tempId;
                    if (tempId) {
                        (async () => {
                            try {
                                await TempIdMapStore.delete(tempId);
                            } catch (e) {
                                safeCaptureException(e as Error);
                            }
                        })();

                        dispatch({ type: 'CLEAR_MAPPING', tempId });
                        emitEvent('tempid:cleared', { tempId } as any);
                    }
                } catch (e) {
                    safeCaptureException(e as Error);
                }
            }
        );

        return () => {
            try {
                if (typeof offSetReq === 'function') offSetReq();
                if (typeof offClearReq === 'function') offClearReq();
            } catch (err) {
                safeCaptureException(err as Error);
            }
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
