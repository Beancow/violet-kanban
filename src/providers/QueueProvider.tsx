import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { Draft } from 'immer';
import type { ReactNode } from 'react';
import type { VioletKanbanAction } from '../store/appStore';
import { useTempIdMap } from './TempIdMapProvider';
import { useBoardStore } from './BoardProvider';
import { useListStore } from './ListProvider';
import { useCardStore } from './CardProvider';
import { reducer as queueReducer } from './reducers/queueReducer';
import { registerQueueAdapter } from './adapter';

// Minimal queue reducer using same concepts: queues for board/list/card actions

type State = {
    boardActionQueue: VioletKanbanAction[];
    listActionQueue: VioletKanbanAction[];
    cardActionQueue: VioletKanbanAction[];
};

type Action =
    | { type: 'ENQUEUE_BOARD'; action: VioletKanbanAction }
    | { type: 'ENQUEUE_LIST'; action: VioletKanbanAction }
    | { type: 'ENQUEUE_CARD'; action: VioletKanbanAction }
    | { type: 'REMOVE_BOARD_BY_ID'; itemId: string }
    | { type: 'REMOVE_LIST_BY_ID'; itemId: string }
    | { type: 'REMOVE_CARD_BY_ID'; itemId: string }
    | { type: 'SET_STATE'; state: State };

const STORAGE_KEY = 'violet-kanban-queue-storage';

function getActionItemId(action: VioletKanbanAction): string | undefined {
    // ported simple helper: check payload.data.id or payload.id or payload.tempId
    try {
        const payload = (action as any).payload as any;
        if (payload) {
            if (payload.data && typeof payload.data === 'object') {
                if (typeof payload.data.id === 'string') return payload.data.id;
                if (typeof payload.data.tempId === 'string')
                    return payload.data.tempId;
            }
            if (typeof payload.id === 'string') return payload.id;
            if (typeof payload.tempId === 'string') return payload.tempId;
        }
    } catch (e) {
        // ignore
    }
    return undefined;
}

function squashQueueActions(
    queue: VioletKanbanAction[],
    newAction: VioletKanbanAction
) {
    const newId = getActionItemId(newAction);
    const newType = newAction.type;
    const filteredQueue = queue.filter((action) => {
        const id = getActionItemId(action);
        return !(id && newId && id === newId && action.type === newType);
    });
    return [...filteredQueue, newAction];
}

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
        initial = {
            boardActionQueue: [],
            listActionQueue: [],
            cardActionQueue: [],
        };
    }

    const [state, dispatch] = useReducer(queueReducer as any, initial);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // ignore
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

export function useQueueStore() {
    const ctx = useContext(QueueContext);
    if (!ctx)
        throw new Error('useQueueStore must be used within QueueProvider');
    return ctx;
}

// queue reducer lives in src/providers/reducers/queueReducer.ts
