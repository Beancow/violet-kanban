'use client';
import React, { createContext, useContext } from 'react';
import { safeCaptureException } from '@/lib/sentryWrapper';
import type { ReactNode } from 'react';
import { useBoards } from './BoardProvider';
import { useLists } from './ListProvider';
import { useCards } from './CardProvider';
import { useQueues } from './QueueProvider';
import { useTempIdMap } from './TempIdMapProvider';
import { computeQueueItemId } from './helpers';
import { emitEvent, onEvent } from '@/utils/eventBusClient';
import {
    isObject,
    hasTempId,
    hasBoardProp,
    hasListProp,
    hasCardProp,
    hasIdProp,
} from '@/types/typeGuards';

type ReconciliationApi = {
    reconcileSuccess: (payload: unknown, queueItem?: unknown) => Promise<void>;
};

const ReconciliationContext = createContext<ReconciliationApi | null>(null);

export function ReconciliationProvider({ children }: { children: ReactNode }) {
    // Hooks may not be available in certain test harnesses where the
    // Board/List/Card/Queue providers are intentionally omitted. Call
    // each hook inside a try/catch so the provider can still mount and
    // tests that mock the reconciliation provider can replace it.
    function safeUse<T>(hook: () => T): T | null {
        try {
            return hook();
        } catch (e) {
            return null;
        }
    }

    const boards = safeUse(useBoards);
    const lists = safeUse(useLists);
    const cards = safeUse(useCards);
    const queues = safeUse(useQueues);
    const tempMap = safeUse(useTempIdMap);

    const reconcileSuccess = async (payload: unknown, queueItem?: unknown) => {
        try {
            // Board payload
            if (hasBoardProp(payload)) {
                // Narrowed by hasBoardProp: payload is { board: unknown }
                const board = (payload as { board: unknown }).board;
                try {
                    boards?.addBoard && boards.addBoard(board as any);
                } catch (e) {
                    safeCaptureException(e as Error);
                }
            } else if (hasListProp(payload)) {
                const list = (payload as { list: unknown }).list;
                try {
                    lists?.addList && lists.addList(list as any);
                } catch (e) {
                    safeCaptureException(e as Error);
                }
            } else if (hasCardProp(payload)) {
                const card = (payload as { card: unknown }).card;
                try {
                    cards?.addCard && cards.addCard(card as any);
                } catch (e) {
                    safeCaptureException(e as Error);
                }
            } else if (isObject(payload) && 'id' in payload) {
                // Generic id-like payloads: try to update board/list/card by id
                const p = payload as Record<string, unknown>;
                const id = String(p.id);
                // best-effort: attempt update flows
                try {
                    boards?.updateBoard &&
                        boards.updateBoard({ id, ...(p as any) });
                } catch (e) {
                    /* ignore - try lists/cards next */
                }
                try {
                    lists?.updateList &&
                        lists.updateList({ id, ...(p as any) });
                } catch (e) {
                    /* ignore */
                }
                try {
                    cards?.updateCard &&
                        cards.updateCard({ id, ...(p as any) });
                } catch (e) {
                    /* ignore */
                }
            }

            // Remove the queue item deterministically when possible. If the
            // worker returned a tempId we can compute the canonical queue id
            // using computeQueueItemId and the temp->real mapping, otherwise
            // fall back to best-effort removals.
            try {
                let removed = false;
                // If payload has a tempId, try to compute the original queue id
                if (hasTempId(payload)) {
                    // hasTempId narrows payload to { tempId: string }
                    const t = payload.tempId as string;
                    // compute expected queue id for create-* actions referencing tempId
                    try {
                        const maybeReal = tempMap
                            ? tempMap.getRealId(t)
                            : undefined;
                        if (maybeReal) {
                            // try board/list/card remove with computed ids
                            const boardQueueId = computeQueueItemId({
                                type: 'create-board',
                                payload: { data: { tempId: t } },
                            } as any);
                            try {
                                queues?.removeBoardAction &&
                                    queues.removeBoardAction(boardQueueId);
                                removed = true;
                            } catch (_) {
                                /* ignore */
                            }
                            const listQueueId = computeQueueItemId({
                                type: 'create-list',
                                payload: { data: { tempId: t } },
                            } as any);
                            try {
                                queues?.removeListAction &&
                                    queues.removeListAction(listQueueId);
                                removed = true;
                            } catch (_) {
                                /* ignore */
                            }
                            const cardQueueId = computeQueueItemId({
                                type: 'create-card',
                                payload: { data: { tempId: t } },
                            } as any);
                            try {
                                queues?.removeCardAction &&
                                    queues.removeCardAction(cardQueueId);
                                removed = true;
                            } catch (_) {
                                /* ignore */
                            }
                        }
                    } catch (e) {
                        /* ignore */
                    }
                }

                // If not removed above, fall back to best-effort removal using
                // queueItem.id when provided.
                if (!removed && hasIdProp(queueItem)) {
                    const id = String((queueItem as { id: unknown }).id);
                    try {
                        queues?.removeBoardAction &&
                            queues.removeBoardAction(id);
                        removed = true;
                    } catch (_) {
                        /* ignore */
                    }
                    try {
                        queues?.removeListAction && queues.removeListAction(id);
                        removed = true;
                    } catch (_) {
                        /* ignore */
                    }
                    try {
                        queues?.removeCardAction && queues.removeCardAction(id);
                        removed = true;
                    } catch (_) {
                        /* ignore */
                    }
                }

                // Clear tempId mapping after successful reconciliation if mapping exists
                if (hasTempId(payload)) {
                    try {
                        const t = payload.tempId as string;
                        try {
                            // emit via generic helper
                            emitEvent('tempid:clear-request', {
                                tempId: t,
                            } as any);
                        } catch (_) {}
                    } catch (e) {
                        /* ignore */
                    }
                }
            } catch (e) {
                safeCaptureException(e as Error);
            }
        } catch (e) {
            safeCaptureException(e as Error);
        }
    };

    const api: ReconciliationApi = {
        reconcileSuccess,
    };
    // Listen for reconciliation requests and keep the subscription lifecycle
    // tied to the provider's mount/unmount.
    React.useEffect(() => {
        const off = onEvent(
            'reconciliation:request',
            async (p: { payload: unknown; queueItem?: unknown }) => {
                try {
                    await reconcileSuccess(p.payload, p.queueItem);
                    emitEvent('reconciliation:success', {
                        payload: p.payload,
                        queueItem: p.queueItem,
                    } as any);
                } catch (err) {
                    emitEvent('reconciliation:fail', {
                        payload: p.payload,
                        queueItem: p.queueItem,
                        error: err,
                    } as any);
                }
            }
        );

        return () => {
            try {
                if (typeof off === 'function') off();
            } catch (_) {}
        };
        // We intentionally depend on `reconcileSuccess` so the handler
        // always calls the latest implementation which may reference
        // up-to-date provider hooks. This effect will re-subscribe if
        // those dependencies change.
    }, [reconcileSuccess]);
    // Render the provider so children are available to the app/test tree.
    return (
        <ReconciliationContext.Provider value={api}>
            {children}
        </ReconciliationContext.Provider>
    );
}

export function useReconciliation() {
    const ctx = useContext(ReconciliationContext);
    if (!ctx)
        throw new Error(
            'useReconciliation must be used within ReconciliationProvider'
        );
    return ctx;
}

// Safe hook variant: returns a no-op API when provider is not present. This
// prevents components (like SyncManager) from throwing in test harnesses
// that don't wrap the tree with ReconciliationProvider.
// fallback hook intentionally omitted; tests should mock the provider via
//    `tests/utils/providerMocks.mockReconciliationProvider()` when needed.

export default ReconciliationProvider;
