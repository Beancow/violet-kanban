import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Board, BoardList, BoardCard } from '../types/appState.type';

// Use the existing SyncAction type as a base for VioletKanbanAction
export type VioletKanbanAction = import('../types/worker.type').SyncAction;

export interface AppState {
    boards: Board[];
    lists: BoardList[];
    cards: BoardCard[];
    boardActionQueue: VioletKanbanAction[];
    listActionQueue: VioletKanbanAction[];
    cardActionQueue: VioletKanbanAction[];
    staleBoardActions?: VioletKanbanAction[];
    staleListActions?: VioletKanbanAction[];
    staleCardActions?: VioletKanbanAction[];
    orphanedCards?: BoardCard[];
}

// Helper: Squash queue actions by item id and type
function getActionItemId(action: VioletKanbanAction): string | undefined {
    // Try to extract the item id from payload.data or payload.id
    if ('payload' in action) {
        if (
            'data' in action.payload &&
            action.payload.data &&
            'id' in action.payload.data
        ) {
            return action.payload.data.id;
        }
        if ('id' in action.payload) {
            return action.payload.id;
        }
    }
    return undefined;
}

function squashQueueActions(
    queue: VioletKanbanAction[],
    newAction: VioletKanbanAction
): VioletKanbanAction[] {
    const newId = getActionItemId(newAction);
    const newType = newAction.type;
    const filteredQueue = queue.filter((action) => {
        const id = getActionItemId(action);
        // Only squash if both id and type match
        return !(id && newId && id === newId && action.type === newType);
    });
    return [...filteredQueue, newAction];
}

// Conflict detection helper: returns true if local action is stale compared to server data
export function isActionStale(
    localAction: VioletKanbanAction,
    serverUpdatedAt: string | number | undefined
): boolean {
    if (!serverUpdatedAt) return false;
    const localTimestamp = localAction.timestamp;
    const serverTimestamp =
        typeof serverUpdatedAt === 'string'
            ? Date.parse(serverUpdatedAt)
            : serverUpdatedAt;
    return serverTimestamp > localTimestamp;
}

// Returns true if the action for a card is stale compared to the store's card updatedAt
export function isCardActionStale(
    action: VioletKanbanAction,
    get: () => AppState
): boolean {
    const cardId = getActionItemId(action);
    if (!cardId) return false;
    const card = get().cards.find((c) => c.id === cardId);
    if (!card || !card.updatedAt) return false;
    const serverUpdatedAt =
        typeof card.updatedAt === 'string'
            ? Date.parse(card.updatedAt)
            : card.updatedAt;
    return serverUpdatedAt > action.timestamp;
}

// Returns true if the action for a board is stale compared to the store's board updatedAt
export function isBoardActionStale(
    action: VioletKanbanAction,
    get: () => AppState
): boolean {
    const boardId = getActionItemId(action);
    if (!boardId) return false;
    const board = get().boards.find((b) => b.id === boardId);
    if (!board || !board.updatedAt) return false;
    let serverUpdatedAt: number;
    if (typeof board.updatedAt === 'string') {
        serverUpdatedAt = Date.parse(board.updatedAt);
    } else if (typeof board.updatedAt === 'number') {
        serverUpdatedAt = board.updatedAt;
    } else if (
        typeof board.updatedAt === 'object' &&
        board.updatedAt !== null &&
        typeof (board.updatedAt as Date).getTime === 'function'
    ) {
        serverUpdatedAt = (board.updatedAt as Date).getTime();
    } else {
        return false;
    }
    return serverUpdatedAt > action.timestamp;
}

// Returns true if the action for a list is stale compared to the store's list updatedAt
export function isListActionStale(
    action: VioletKanbanAction,
    get: () => AppState
): boolean {
    const listId = getActionItemId(action);
    if (!listId) return false;
    const list = get().lists.find((l) => l.id === listId);
    if (!list || !list.updatedAt) return false;
    let serverUpdatedAt: number;
    if (typeof list.updatedAt === 'string') {
        serverUpdatedAt = Date.parse(list.updatedAt);
    } else if (typeof list.updatedAt === 'number') {
        serverUpdatedAt = list.updatedAt;
    } else if (
        typeof list.updatedAt === 'object' &&
        list.updatedAt !== null &&
        typeof (list.updatedAt as Date).getTime === 'function'
    ) {
        serverUpdatedAt = (list.updatedAt as Date).getTime();
    } else {
        return false;
    }
    return serverUpdatedAt > action.timestamp;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            boards: [],
            lists: [],
            cards: [],
            boardActionQueue: [],
            listActionQueue: [],
            cardActionQueue: [],
            staleBoardActions: [],
            staleListActions: [],
            staleCardActions: [],
            orphanedCards: [],

            // Board actions
            addBoard: (board: Board) =>
                set((state) => ({ boards: [...state.boards, board] })),
            updateBoard: (board: Board) =>
                set((state) => ({
                    boards: state.boards.map((b) =>
                        b.id === board.id ? board : b
                    ),
                })),
            removeBoard: (boardId: string) =>
                set((state) => ({
                    boards: state.boards.filter((b) => b.id !== boardId),
                })),

            // List actions
            addList: (list: BoardList) =>
                set((state) => ({ lists: [...state.lists, list] })),
            updateList: (list: BoardList) =>
                set((state) => ({
                    lists: state.lists.map((l) =>
                        l.id === list.id ? list : l
                    ),
                })),
            removeList: (listId: string) =>
                set((state) => ({
                    lists: state.lists.filter((l) => l.id !== listId),
                })),

            // Card actions
            addCard: (card: BoardCard) =>
                set((state) => ({ cards: [...state.cards, card] })),
            updateCard: (card: BoardCard) =>
                set((state) => ({
                    cards: state.cards.map((c) =>
                        c.id === card.id ? card : c
                    ),
                })),
            removeCard: (cardId: string) =>
                set((state) => ({
                    cards: state.cards.filter((c) => c.id !== cardId),
                })),

            // Queue actions
            enqueueBoardAction: (action: VioletKanbanAction) =>
                set((state) => ({
                    boardActionQueue: squashQueueActions(
                        state.boardActionQueue,
                        action
                    ),
                })),
            enqueueListAction: (action: VioletKanbanAction) =>
                set((state) => ({
                    listActionQueue: squashQueueActions(
                        state.listActionQueue,
                        action
                    ),
                })),
            enqueueCardAction: (action: VioletKanbanAction) =>
                set((state) => ({
                    cardActionQueue: squashQueueActions(
                        state.cardActionQueue,
                        action
                    ),
                })),
            dequeueBoardAction: () =>
                set((state) => ({
                    boardActionQueue: state.boardActionQueue.slice(1),
                })),
            dequeueListAction: () =>
                set((state) => ({
                    listActionQueue: state.listActionQueue.slice(1),
                })),
            dequeueCardAction: () =>
                set((state) => ({
                    cardActionQueue: state.cardActionQueue.slice(1),
                })),

            // Process actions with conflict detection
            processBoardAction: (action: VioletKanbanAction) => {
                const boardId = getActionItemId(action);
                let isStale = false;
                // Check for staleness by timestamp
                if (isBoardActionStale(action, get)) {
                    isStale = true;
                }
                // If action is a delete-board, fully delete lists, mark cards as orphaned
                if (action.type === 'delete-board' && boardId) {
                    set((state) => ({
                        lists: state.lists.filter(
                            (list) => list.boardId !== boardId
                        ),
                        orphanedCards: [
                            ...(state.orphanedCards ?? []),
                            ...state.cards.filter(
                                (card) => card.boardId === boardId
                            ),
                        ],
                        // Cards remain accessible, boardId is preserved
                    }));
                }
                if (isStale) {
                    set((state) => ({
                        staleBoardActions: [
                            ...(state.staleBoardActions || []),
                            action,
                        ],
                        boardActionQueue: state.boardActionQueue.filter(
                            (a) => a !== action
                        ),
                    }));
                } else {
                    set((state) => ({
                        boardActionQueue: squashQueueActions(
                            state.boardActionQueue,
                            action
                        ),
                    }));
                }
            },
            processListAction: (action: VioletKanbanAction) => {
                const listId = getActionItemId(action);
                let isStale = false;
                let missingBoard = false;
                // Check if list exists and get boardId from payload
                let boardId: string | undefined;
                if ('payload' in action) {
                    if ('data' in action.payload && action.payload.data) {
                        const data = action.payload.data as Partial<BoardList>;
                        if (
                            'boardId' in data &&
                            typeof data.boardId === 'string'
                        ) {
                            boardId = data.boardId;
                        }
                    } else {
                        boardId = (action.payload as any).boardId;
                    }
                }
                // Validate boardId
                if (boardId && !get().boards.some((b) => b.id === boardId)) {
                    missingBoard = true;
                    isStale = true;
                }
                // Check for staleness by timestamp
                if (isListActionStale(action, get)) {
                    isStale = true;
                }
                // If action is a delete-list, set listId to null for all cards referencing that list
                if (action.type === 'delete-list' && listId) {
                    set((state) => ({
                        cards: state.cards.map((card) =>
                            card.listId === listId
                                ? { ...card, listId: null }
                                : card
                        ),
                    }));
                }
                if (isStale) {
                    set((state) => ({
                        staleListActions: [
                            ...(state.staleListActions || []),
                            { ...action, meta: { missingBoard } },
                        ],
                        listActionQueue: state.listActionQueue.filter(
                            (a) => a !== action
                        ),
                    }));
                } else {
                    set((state) => ({
                        listActionQueue: squashQueueActions(
                            state.listActionQueue,
                            action
                        ),
                    }));
                }
            },
            processCardAction: (action: VioletKanbanAction) => {
                const cardId = getActionItemId(action);
                let isStale = false;
                let missingBoard = false;
                let missingList = false;
                // Check if card exists and get boardId/listId from payload
                let boardId: string | undefined;
                let listId: string | undefined;
                if ('payload' in action) {
                    if ('data' in action.payload && action.payload.data) {
                        // Only extract boardId/listId if data is a BoardCard
                        const data = action.payload.data as Partial<BoardCard>;
                        if (
                            'boardId' in data &&
                            typeof data.boardId === 'string'
                        ) {
                            boardId = data.boardId;
                        }
                        if (
                            'listId' in data &&
                            typeof data.listId === 'string'
                        ) {
                            listId = data.listId;
                        }
                    } else {
                        boardId = (action.payload as any).boardId;
                        listId = (action.payload as any).listId;
                    }
                }
                // Validate boardId and listId
                if (boardId && !get().boards.some((b) => b.id === boardId)) {
                    missingBoard = true;
                    isStale = true;
                }
                if (listId && !get().lists.some((l) => l.id === listId)) {
                    missingList = true;
                    isStale = true;
                }
                // Check for staleness by timestamp
                if (isCardActionStale(action, get)) {
                    isStale = true;
                }
                if (isStale) {
                    set((state) => ({
                        staleCardActions: [
                            ...(state.staleCardActions || []),
                            { ...action, meta: { missingBoard, missingList } },
                        ],
                        cardActionQueue: state.cardActionQueue.filter(
                            (a) => a !== action
                        ),
                    }));
                } else {
                    set((state) => ({
                        cardActionQueue: squashQueueActions(
                            state.cardActionQueue,
                            action
                        ),
                    }));
                }
            },

            // Action to recover or reassign orphaned cards
            recoverOrphanedCard: (cardId: string, newBoardId: string) =>
                set((state) => ({
                    orphanedCards: (state.orphanedCards ?? []).filter(
                        (card) => card.id !== cardId
                    ),
                    cards: state.cards.map((card) =>
                        card.id === cardId
                            ? { ...card, boardId: newBoardId }
                            : card
                    ),
                })),

            // Placeholder for custom middleware (queue squashing, conflict detection, etc.)
            // These can be implemented as helper functions or Zustand middleware wrappers
        }),
        {
            name: 'violet-kanban-storage', // localStorage key
        }
    )
);
