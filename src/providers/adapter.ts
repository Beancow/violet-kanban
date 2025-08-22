// Runtime adapters for non-React code that expects StoreApi access.
// Providers should register their minimal API surface here on mount.

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
