import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { Draft } from 'immer';
import { reducer as boardReducer } from './reducers/boardReducer';
import { registerBoardAdapter } from './adapter';
import type { ReactNode } from 'react';
import type { Board } from '../types/appState.type';

type State = {
    boards: Board[];
};

type Action =
    | { type: 'ADD_BOARD'; board: Board }
    | { type: 'UPDATE_BOARD'; board: Partial<Board> & { id: string } }
    | { type: 'REMOVE_BOARD'; boardId: string }
    | { type: 'SET_BOARDS'; boards: Board[] };

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
        initial = { boards: [] };
    }

    const [state, dispatch] = useReducer(boardReducer as any, initial);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // ignore
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

export function useBoardStore() {
    const ctx = useContext(BoardContext);
    if (!ctx)
        throw new Error('useBoardStore must be used within BoardProvider');
    return ctx;
}
