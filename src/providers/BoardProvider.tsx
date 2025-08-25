'use client';
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { safeCaptureException } from '@/lib/sentryWrapper';
import { reducer as boardReducer } from './reducers/boardReducer';
import { registerBoardAdapter } from './adapter';
import type { ReactNode } from 'react';
import type { Board } from '../types/appState.type';

type State = {
    boards: Board[];
};

const STORAGE_KEY = 'violet-kanban-board-storage';

const BoardContext = createContext<{
    state: State;
    addBoard: (board: Board) => void;
    updateBoard: (board: Partial<Board> & { id: string }) => void;
    removeBoard: (boardId: string) => void;
} | null>(null);

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

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // Log write errors for diagnostics (e.g., storage quota exceeded)
            console.error('[board] failed to write to localStorage', e);
            safeCaptureException(e);
        }
    }, [state]);

    const api = {
        state,
        addBoard: (board: Board) => dispatch({ type: 'ADD_BOARD', board }),
        updateBoard: (board: Partial<Board> & { id: string }) =>
            dispatch({ type: 'UPDATE_BOARD', board }),
        removeBoard: (boardId: string) =>
            dispatch({ type: 'REMOVE_BOARD', boardId }),
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
