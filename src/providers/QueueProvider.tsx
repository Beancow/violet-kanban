'use client';

import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { safeCaptureException } from '@/lib/sentryWrapper';
import type { ReactNode } from 'react';
import type { VioletKanbanAction, QueueItem } from '@/types';
import type { QueueApi } from '@/types/provider-apis';
import { reducer as queueReducer } from './reducers/queueReducer';
import { registerQueueAdapter } from './adapter';
import { computeQueueItemId } from './helpers';
import { emitEvent } from '@/utils/eventBusClient';

type State = {
    boardActionQueue: QueueItem[];
    listActionQueue: QueueItem[];
    cardActionQueue: QueueItem[];
};

const STORAGE_KEY = 'violet-kanban-queue-storage';

// reducer lives in src/providers/reducers/queueReducer.ts

const QueueContext = createContext<QueueApi | null>(null);

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

    const api = React.useMemo(() => {
        return {
            state,
            enqueueBoardAction: (a: VioletKanbanAction) => {
                const item = wrap(a);
                console.debug('[QueueProvider] enqueueBoardAction', {
                    id: item.id,
                    type: a.type,
                });
                dispatch({ type: 'ENQUEUE_BOARD', action: item });
                // notify the sync manager that the queue changed so it can start
                // processing immediately (e.g. after a user action)
                emitEvent('queue:updated', { kind: 'board' });
            },
            enqueueListAction: (a: VioletKanbanAction) => {
                const item = wrap(a);
                console.debug('[QueueProvider] enqueueListAction', {
                    id: item.id,
                    type: a.type,
                });
                dispatch({ type: 'ENQUEUE_LIST', action: item });
                emitEvent('queue:updated', { kind: 'list' });
            },
            enqueueCardAction: (a: VioletKanbanAction) => {
                const item = wrap(a);
                console.debug('[QueueProvider] enqueueCardAction', {
                    id: item.id,
                    type: a.type,
                });
                dispatch({ type: 'ENQUEUE_CARD', action: item });
                emitEvent('queue:updated', { kind: 'card' });
            },
            removeBoardAction: (id: string) =>
                dispatch({ type: 'REMOVE_BOARD_BY_ID', itemId: id }),
            removeListAction: (id: string) =>
                dispatch({ type: 'REMOVE_LIST_BY_ID', itemId: id }),
            removeCardAction: (id: string) =>
                dispatch({ type: 'REMOVE_CARD_BY_ID', itemId: id }),
        } as QueueApi;
        // Keep identity stable except when `state` changes. `dispatch` is stable.
    }, [state]);

    // Register the adapter once when the provider mounts. Avoid re-registering
    // on every state change which can cause transient unregister/register
    // cycles and timing issues for consumers that read the adapter.
    useEffect(() => {
        registerQueueAdapter({
            enqueueBoardAction: api.enqueueBoardAction,
            enqueueListAction: api.enqueueListAction,
            enqueueCardAction: api.enqueueCardAction,
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
