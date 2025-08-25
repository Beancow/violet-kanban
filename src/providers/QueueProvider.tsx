'use client';
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import * as Sentry from '@/lib/sentryWrapper';
import { safeCaptureException } from '@/lib/sentryWrapper';
import type { ReactNode } from 'react';
import type { VioletKanbanAction } from '@/types/violet-kanban-action';
// Provider hooks imported but not directly used in this file
// import { useTempIdMap } from './TempIdMapProvider';
// import { useBoards } from './BoardProvider';
// import { useLists } from './ListProvider';
// import { useCards } from './CardProvider';
import { reducer as queueReducer } from './reducers/queueReducer';
import { registerQueueAdapter } from './adapter';
import {
    getActionItemId as _getActionItemId,
    squashQueueActions as _squashQueueActions,
} from './helpers';

// Minimal queue reducer using same concepts: queues for board/list/card actions

type State = {
    boardActionQueue: VioletKanbanAction[];
    listActionQueue: VioletKanbanAction[];
    cardActionQueue: VioletKanbanAction[];
};

type _Action =
    | { type: 'ENQUEUE_BOARD'; action: VioletKanbanAction }
    | { type: 'ENQUEUE_LIST'; action: VioletKanbanAction }
    | { type: 'ENQUEUE_CARD'; action: VioletKanbanAction }
    | { type: 'REMOVE_BOARD_BY_ID'; itemId: string }
    | { type: 'REMOVE_LIST_BY_ID'; itemId: string }
    | { type: 'REMOVE_CARD_BY_ID'; itemId: string }
    | { type: 'SET_STATE'; state: State };

const STORAGE_KEY = 'violet-kanban-queue-storage';

// reducer lives in src/providers/reducers/queueReducer.ts

const QueueContext = createContext<{
    state: State;
    enqueueBoardAction: (a: VioletKanbanAction) => void;
    enqueueListAction: (a: VioletKanbanAction) => void;
    enqueueCardAction: (a: VioletKanbanAction) => void;
    removeBoardAction: (id: string) => void;
    removeListAction: (id: string) => void;
    removeCardAction: (id: string) => void;
} | null>(null);

export function QueueProvider({ children }: { children: ReactNode }) {
    let initial: State = {
        boardActionQueue: [],
        listActionQueue: [],
        cardActionQueue: [],
    };
    try {
        if (typeof window !== 'undefined') {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) initial = JSON.parse(raw) as State;
        }
    } catch (e) {
        // Log parse/read errors when hydrating queue from localStorage.
        console.error('[queue] failed to read from localStorage', e);
        safeCaptureException(e);
        initial = {
            boardActionQueue: [],
            listActionQueue: [],
            cardActionQueue: [],
        };
    }

    const [state, dispatch] = useReducer(queueReducer, initial);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // Log write errors for diagnostics (e.g., storage quota exceeded)
            console.error('[queue] failed to write to localStorage', e);
            safeCaptureException(e);
        }
    }, [state]);

    const api = {
        state,
        enqueueBoardAction: (a: VioletKanbanAction) =>
            dispatch({ type: 'ENQUEUE_BOARD', action: a }),
        enqueueListAction: (a: VioletKanbanAction) =>
            dispatch({ type: 'ENQUEUE_LIST', action: a }),
        enqueueCardAction: (a: VioletKanbanAction) =>
            dispatch({ type: 'ENQUEUE_CARD', action: a }),
        removeBoardAction: (id: string) =>
            dispatch({ type: 'REMOVE_BOARD_BY_ID', itemId: id }),
        removeListAction: (id: string) =>
            dispatch({ type: 'REMOVE_LIST_BY_ID', itemId: id }),
        removeCardAction: (id: string) =>
            dispatch({ type: 'REMOVE_CARD_BY_ID', itemId: id }),
    };

    useEffect(() => {
        registerQueueAdapter({
            enqueueBoardAction: api.enqueueBoardAction,
            enqueueListAction: api.enqueueListAction,
            enqueueCardAction: api.enqueueCardAction,
        });
        return () => registerQueueAdapter(null);
    }, [state]);

    return (
        <QueueContext.Provider value={api}>{children}</QueueContext.Provider>
    );
}

export function useQueues() {
    const ctx = useContext(QueueContext);
    if (!ctx) throw new Error('useQueues must be used within QueueProvider');
    return ctx;
}

// queue reducer lives in src/providers/reducers/queueReducer.ts
