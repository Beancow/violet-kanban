/*
 * Runtime adapters for non-React code to interact with provider surfaces.
 *
 * Purpose and maintenance note:
 * - This module is intentionally a small "test seam" and a non-React bridge.
 * - Providers register their runtime callbacks with `register*Adapter` when
 *   they mount on the client. Non-React consumers (web workers, background
 *   scripts, or test harnesses) use `get*Adapter()` to obtain those callbacks.
 * - Keep this file in place unless you have migrated all tests to render the
 *   provider in a test DOM and converted any non-React consumers to call the
 *   provider hook API. Removing this file prematurely will break tests and
 *   any integrations that rely on the adapter pattern.
 */

type BoardAdapter = {
    addBoard?: (b: import('../types/appState.type').Board) => void;
    updateBoard?: (
        b: Partial<import('../types/appState.type').Board> & { id: string }
    ) => void;
    removeBoard?: (id: string) => void;
};

let boardAdapter: BoardAdapter | null = null;

export function registerBoardAdapter(adapter: BoardAdapter | null) {
    boardAdapter = adapter;
}

export function getBoardAdapter(): BoardAdapter | null {
    return boardAdapter;
}

// List adapter
type ListAdapter = {
    addList?: (l: import('../types/appState.type').BoardList) => void;
    updateList?: (
        l: Partial<import('../types/appState.type').BoardList> & { id: string }
    ) => void;
    removeList?: (id: string) => void;
};

let listAdapter: ListAdapter | null = null;

export function registerListAdapter(adapter: ListAdapter | null) {
    listAdapter = adapter;
}

export function getListAdapter(): ListAdapter | null {
    return listAdapter;
}

// Card adapter
type CardAdapter = {
    addCard?: (c: import('../types/appState.type').BoardCard) => void;
    updateCard?: (
        c: Partial<import('../types/appState.type').BoardCard> & { id: string }
    ) => void;
    removeCard?: (id: string) => void;
    markCardOrphaned?: (id: string) => void;
};

let cardAdapter: CardAdapter | null = null;

export function registerCardAdapter(adapter: CardAdapter | null) {
    cardAdapter = adapter;
}

export function getCardAdapter(): CardAdapter | null {
    return cardAdapter;
}

// Queue adapter (minimal surface)
import type { VioletKanbanAction } from '@/types/violet-kanban-action';

type QueueAdapter = {
    enqueueBoardAction?: (a: VioletKanbanAction) => void;
    enqueueListAction?: (a: VioletKanbanAction) => void;
    enqueueCardAction?: (a: VioletKanbanAction) => void;
};

let queueAdapter: QueueAdapter | null = null;

export function registerQueueAdapter(adapter: QueueAdapter | null) {
    queueAdapter = adapter;
}

export function getQueueAdapter(): QueueAdapter | null {
    return queueAdapter;
}

// Similar adapters for list/card/queue can be added as needed.
