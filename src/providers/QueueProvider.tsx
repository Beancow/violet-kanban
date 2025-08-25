'use client';
// debug: module load trace for test triage
// eslint-disable-next-line no-console
console.debug && console.debug('[module-load] src/providers/QueueProvider');
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import * as Sentry from '@/lib/sentryWrapper';
import { safeCaptureException } from '@/lib/sentryWrapper';
import type { ReactNode } from 'react';
import type { VioletKanbanAction, QueueItem } from '@/types';
import type { QueueApi } from '@/types/provider-apis';
// Provider hooks imported but not directly used in this file
// import { useTempIdMap } from './TempIdMapProvider';
// import { useBoards } from './BoardProvider';
// import { useLists } from './ListProvider';
// import { useCards } from './CardProvider';
import { reducer as queueReducer } from './reducers/queueReducer';
import { registerQueueAdapter } from './adapter';
import {
    computeQueueItemId,
    unwrapQueueAction,
    squashQueueActions as _squashQueueActions,
} from './helpers';

// Minimal queue reducer using same concepts: queues for board/list/card actions

type State = {
    boardActionQueue: QueueItem[];
    listActionQueue: QueueItem[];
    cardActionQueue: QueueItem[];
    orgActionQueue?: QueueItem[];
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

const QueueContext = createContext<QueueApi | null>(null);

export function QueueProvider({ children }: { children: ReactNode }) {
    let initial: State = {
        boardActionQueue: [],
        listActionQueue: [],
        cardActionQueue: [],
        orgActionQueue: [],
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

    const [state, dispatch] = useReducer(queueReducer, initial as State);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // Log write errors for diagnostics (e.g., storage quota exceeded)
            console.error('[queue] failed to write to localStorage', e);
            safeCaptureException(e);
        }
    }, [state]);

    // helper to wrap a VioletKanbanAction into a QueueItem
    const wrap = (action: VioletKanbanAction): QueueItem => {
        const id = computeQueueItemId(action);
        return {
            id,
            action,
            meta: {
                enqueuedAt: Date.now(),
                attempts: 0,
                nextAttemptAt: null,
                ttlMs: null,
                lastError: null,
            },
        };
    };

    const api = {
        state,
        enqueueBoardAction: (a: VioletKanbanAction) => {
            const item = wrap(a);
            console.debug('[QueueProvider] enqueueBoardAction', {
                id: item.id,
                type: a.type,
            });
            dispatch({ type: 'ENQUEUE_BOARD', action: item });
        },
        enqueueListAction: (a: VioletKanbanAction) => {
            const item = wrap(a);
            console.debug('[QueueProvider] enqueueListAction', {
                id: item.id,
                type: a.type,
            });
            dispatch({ type: 'ENQUEUE_LIST', action: item });
        },
        enqueueCardAction: (a: VioletKanbanAction) => {
            const item = wrap(a);
            console.debug('[QueueProvider] enqueueCardAction', {
                id: item.id,
                type: a.type,
            });
            dispatch({ type: 'ENQUEUE_CARD', action: item });
        },
        enqueueOrgAction: (a: VioletKanbanAction) => {
            const item = wrap(a);
            console.debug('[QueueProvider] enqueueOrgAction', {
                id: item.id,
                type: a.type,
                payload: a.payload,
            });
            dispatch({ type: 'ENQUEUE_ORG', action: item });
        },
        requeueOrgAction: (
            itemId: string,
            metaPatch: Partial<import('@/types/violet-kanban-action').QueueMeta>
        ) => {
            // remove existing and re-add with patched meta
            const existing = (state.orgActionQueue ?? []).find(
                (q) => q.id === itemId
            );
            if (!existing) return;
            const updated: QueueItem = {
                ...existing,
                meta: { ...existing.meta, ...metaPatch },
            };
            dispatch({ type: 'ENQUEUE_ORG', action: updated });
        },
        removeBoardAction: (id: string) =>
            dispatch({ type: 'REMOVE_BOARD_BY_ID', itemId: id }),
        removeListAction: (id: string) =>
            dispatch({ type: 'REMOVE_LIST_BY_ID', itemId: id }),
        removeCardAction: (id: string) =>
            dispatch({ type: 'REMOVE_CARD_BY_ID', itemId: id }),
        removeOrgAction: (id: string) =>
            dispatch({ type: 'REMOVE_ORG_BY_ID', itemId: id }),
    };

    // Register the adapter once when the provider mounts. Avoid re-registering
    // on every state change which can cause transient unregister/register
    // cycles and timing issues for consumers that read the adapter.
    useEffect(() => {
        registerQueueAdapter({
            enqueueBoardAction: api.enqueueBoardAction,
            enqueueListAction: api.enqueueListAction,
            enqueueCardAction: api.enqueueCardAction,
            enqueueOrgAction: api.enqueueOrgAction,
        });
        return () => registerQueueAdapter(null);
        // Intentionally empty deps: we want a single registration on mount.
    }, []);

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
