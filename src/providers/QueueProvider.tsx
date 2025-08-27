'use client';

import React, {
    createContext,
    useContext,
    useEffect,
    useReducer,
    useState,
    useCallback,
} from 'react';
import { safeCaptureException } from '@/lib/sentryWrapper';
import type { ReactNode } from 'react';
import type { VioletKanbanAction, QueueItem } from '@/types';
import type { QueueApi } from '@/types/provider-apis';
import { reducer as queueReducer } from './reducers/queueReducer';
import QueueStore, { type QueueRecord } from '@/stores/QueueStore';
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
    const [state, dispatch] = useReducer(queueReducer, {
        boardActionQueue: [],
        listActionQueue: [],
        cardActionQueue: [],
    } as State);

    // Hydrate initial state from QueueStore (IDB). Keep an in-memory reducer
    // so consumer code and tests remain unchanged.
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const all = await QueueStore.getAll();
                if (!mounted) return;
                const boards: QueueItem[] = [];
                const lists: QueueItem[] = [];
                const cards: QueueItem[] = [];
                for (const r of all) {
                    const qi: QueueItem = {
                        id: r.id,
                        action: r.action,
                        meta: r.meta || {},
                    };
                    const t = (r.action && (r.action as any).type) || '';
                    if (t.startsWith('create-board') || t.includes('board'))
                        boards.push(qi);
                    else if (t.includes('list')) lists.push(qi);
                    else cards.push(qi);
                }
                dispatch({
                    type: 'SET_STATE',
                    state: {
                        boardActionQueue: boards,
                        listActionQueue: lists,
                        cardActionQueue: cards,
                    },
                });
            } catch (e) {
                console.error(
                    '[QueueProvider] failed to hydrate from QueueStore',
                    e
                );
                safeCaptureException(e as Error);
            }
        })();
        // subscribe to store changes (cross-tab)
        const off = QueueStore.subscribe((records: QueueRecord[]) => {
            try {
                const boards: QueueItem[] = [];
                const lists: QueueItem[] = [];
                const cards: QueueItem[] = [];
                for (const r of records) {
                    const qi: QueueItem = {
                        id: r.id,
                        action: r.action,
                        meta: r.meta || {},
                    };
                    const t = (r.action && (r.action as any).type) || '';
                    if (t.startsWith('create-board') || t.includes('board'))
                        boards.push(qi);
                    else if (t.includes('list')) lists.push(qi);
                    else cards.push(qi);
                }
                dispatch({
                    type: 'SET_STATE',
                    state: {
                        boardActionQueue: boards,
                        listActionQueue: lists,
                        cardActionQueue: cards,
                    },
                });
            } catch (e) {
                /* ignore */
            }
        });
        return () => {
            mounted = false;
            try {
                off();
            } catch (_) {}
        };
    }, []);

    // helper to wrap a VioletKanbanAction into a QueueItem
    const wrap = useCallback((action: VioletKanbanAction): QueueItem => {
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
    }, []);

    const api = React.useMemo(() => {
        return {
            state,
            enqueueBoardAction: async (a: VioletKanbanAction) => {
                const item = wrap(a);
                console.debug('[QueueProvider] enqueueBoardAction', {
                    id: item.id,
                    type: a.type,
                });
                try {
                    await QueueStore.put({
                        id: item.id,
                        action: item.action,
                        meta: item.meta,
                    });
                } catch (e) {
                    safeCaptureException(e as Error);
                }
                dispatch({ type: 'ENQUEUE_BOARD', action: item });
                emitEvent('queue:updated', { kind: 'board' });
            },
            enqueueListAction: async (a: VioletKanbanAction) => {
                const item = wrap(a);
                console.debug('[QueueProvider] enqueueListAction', {
                    id: item.id,
                    type: a.type,
                });
                try {
                    await QueueStore.put({
                        id: item.id,
                        action: item.action,
                        meta: item.meta,
                    });
                } catch (e) {
                    safeCaptureException(e as Error);
                }
                dispatch({ type: 'ENQUEUE_LIST', action: item });
                emitEvent('queue:updated', { kind: 'list' });
            },
            enqueueCardAction: async (a: VioletKanbanAction) => {
                const item = wrap(a);
                console.debug('[QueueProvider] enqueueCardAction', {
                    id: item.id,
                    type: a.type,
                });
                try {
                    await QueueStore.put({
                        id: item.id,
                        action: item.action,
                        meta: item.meta,
                    });
                } catch (e) {
                    safeCaptureException(e as Error);
                }
                dispatch({ type: 'ENQUEUE_CARD', action: item });
                emitEvent('queue:updated', { kind: 'card' });
            },
            // Allow updating persisted meta for an item (used by orchestrator)
            updateQueueMeta: async (id: string, meta: any) => {
                try {
                    const rec = await QueueStore.get(id);
                    if (!rec) return;
                    const updated = {
                        ...rec,
                        meta: { ...(rec.meta || {}), ...(meta || {}) },
                    };
                    await QueueStore.put(updated as any);
                    // local state update: replace matching item meta
                    try {
                        const qitem: QueueItem = {
                            id: updated.id,
                            action: updated.action,
                            meta: updated.meta,
                        };
                        dispatch({
                            type: 'SET_STATE',
                            state: {
                                boardActionQueue: state.boardActionQueue.map(
                                    (it) => (it.id === id ? qitem : it)
                                ),
                                listActionQueue: state.listActionQueue.map(
                                    (it) => (it.id === id ? qitem : it)
                                ),
                                cardActionQueue: state.cardActionQueue.map(
                                    (it) => (it.id === id ? qitem : it)
                                ),
                            },
                        });
                    } catch (_) {}
                } catch (e) {
                    safeCaptureException(e as Error);
                }
            },
            removeBoardAction: async (id: string) => {
                try {
                    await QueueStore.delete(id);
                } catch (e) {
                    safeCaptureException(e as Error);
                }
                dispatch({ type: 'REMOVE_BOARD_BY_ID', itemId: id });
            },
            removeListAction: async (id: string) => {
                try {
                    await QueueStore.delete(id);
                } catch (e) {
                    safeCaptureException(e as Error);
                }
                dispatch({ type: 'REMOVE_LIST_BY_ID', itemId: id });
            },
            removeCardAction: async (id: string) => {
                try {
                    await QueueStore.delete(id);
                } catch (e) {
                    safeCaptureException(e as Error);
                }
                dispatch({ type: 'REMOVE_CARD_BY_ID', itemId: id });
            },
        } as QueueApi;
        // Keep identity stable except when `state` changes. `dispatch` is stable.
    }, [state]);

    // Register the adapter once when the provider mounts. Avoid re-registering
    // on every state change which can cause transient unregister/register
    // cycles and timing issues for consumers that read the adapter.
    useEffect(() => {
        registerQueueAdapter({
            enqueueBoardAction: (a) => void api.enqueueBoardAction(a),
            enqueueListAction: (a) => void api.enqueueListAction(a),
            enqueueCardAction: (a) => void api.enqueueCardAction(a),
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
