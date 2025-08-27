'use client';
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { safeCaptureException } from '@/lib/sentryWrapper';
import { useOrganizationProvider } from './OrganizationProvider';
import useFreshToken from '@/hooks/useFreshToken';
import { reducer as boardReducer } from './reducers/boardReducer';
import { registerBoardAdapter } from './adapter';
import type { ReactNode } from 'react';
import type { Board } from '../types/appState.type';
import type { BoardApi } from '@/types/provider-apis';

type State = {
    boards: Board[];
};

const STORAGE_KEY = 'violet-kanban-board-storage';

const BoardContext = createContext<BoardApi | null>(null);

// reducer lives in src/providers/reducers/boardReducer.ts

export function BoardProvider({ children }: { children: ReactNode }) {
    let initial: State = { boards: [] };
    try {
        if (typeof window !== 'undefined') {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) initial = JSON.parse(raw) as State;
        }
    } catch (e) {
        // Log parse/read errors when hydrating boards from localStorage.
        console.error('[board] failed to read from localStorage', e);
        safeCaptureException(e);
        initial = { boards: [] };
    }

    const [state, dispatch] = useReducer(boardReducer, initial);

    const org = useOrganizationProvider();
    const getFreshToken = useFreshToken();

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // Log write errors for diagnostics (e.g., storage quota exceeded)
            console.error('[board] failed to write to localStorage', e);
            safeCaptureException(e);
        }
    }, [state]);

    // Fetch canonical boards when currentOrganizationId changes or when
    // another tab updates the selection via localStorage. We include the
    // organization id in the `X-Organization-Id` header and forward the
    // idToken for authenticated requests.
    useEffect(() => {
        let mounted = true;

        const doFetch = async (orgId: string | null) => {
            if (!orgId) return;
            try {
                const token = await getFreshToken();
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                };
                if (token) headers.Authorization = `Bearer ${token}`;
                headers['X-Organization-Id'] = String(orgId);

                const res = await fetch('/api/boards', {
                    method: 'GET',
                    headers,
                });
                if (!mounted) return;
                if (!res.ok) return;
                const body = await res.json().catch(() => null);
                if (!body || !body.success || !Array.isArray(body.boards)) {
                    return;
                }
                api.setBoards(body.boards as Board[]);
            } catch (e) {
                safeCaptureException(e as Error);
            }
        };

        // Initial fetch when the currentOrganizationId is set
        try {
            doFetch(org.currentOrganizationId);
        } catch (e) {
            /* ignore */
        }

        const onStorage = (ev: StorageEvent) => {
            try {
                if (ev.key === 'currentOrganizationId') {
                    const newVal = ev.newValue;
                    doFetch(newVal);
                }
            } catch (e) {
                /* ignore */
            }
        };

        window.addEventListener('storage', onStorage);
        return () => {
            mounted = false;
            window.removeEventListener('storage', onStorage);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [org.currentOrganizationId]);

    const api = {
        state,
        addBoard: (board: Board) => dispatch({ type: 'ADD_BOARD', board }),
        updateBoard: (board: Partial<Board> & { id: string }) =>
            dispatch({ type: 'UPDATE_BOARD', board }),
        removeBoard: (boardId: string) =>
            dispatch({ type: 'REMOVE_BOARD', boardId }),
        setBoards: (boards: Board[]) =>
            dispatch({ type: 'SET_BOARDS', boards }),
    };
    useEffect(() => {
        registerBoardAdapter({
            addBoard: api.addBoard,
            updateBoard: api.updateBoard,
            removeBoard: api.removeBoard,
        });
        return () => registerBoardAdapter(null);
    }, [state]);
    return (
        <BoardContext.Provider value={api}>{children}</BoardContext.Provider>
    );
}

export function useBoards() {
    const ctx = useContext(BoardContext);
    if (!ctx) throw new Error('useBoards must be used within BoardProvider');
    return ctx;
}
