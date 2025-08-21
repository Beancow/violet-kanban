import { create, StoreApi } from 'zustand';
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
    // actions
    addBoard: (board: Board) => void;
    updateBoard: (board: Board) => void;
    removeBoard: (boardId: string) => void;
    addList: (list: BoardList) => void;
    updateList: (list: BoardList) => void;
    removeList: (listId: string) => void;
    addCard: (card: BoardCard) => void;
    updateCard: (card: BoardCard) => void;
    removeCard: (cardId: string) => void;
    enqueueBoardAction: (action: VioletKanbanAction) => void;
    enqueueListAction: (action: VioletKanbanAction) => void;
    enqueueCardAction: (action: VioletKanbanAction) => void;
    dequeueBoardAction: () => void;
    dequeueListAction: () => void;
    dequeueCardAction: () => void;
    processBoardAction: (action: VioletKanbanAction) => void;
    processListAction: (action: VioletKanbanAction) => void;
    processCardAction: (action: VioletKanbanAction) => void;
    recoverOrphanedCard: (cardId: string, newBoardId: string) => void;
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

export function createAppStore(
    persistEnabled = true
): import('zustand').UseBoundStore<StoreApi<AppState>> {
    const creator: import('zustand').StateCreator<AppState> = (set, get) => ({
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
        addBoard: (board: Board) => set((state: AppState) => ({ boards: [...state.boards, board] })),
        updateBoard: (board: Board) =>
            set((state: AppState) => ({ boards: state.boards.map((b: Board) => (b.id === board.id ? board : b)) })),
        removeBoard: (boardId: string) => set((state: AppState) => ({ boards: state.boards.filter((b: Board) => b.id !== boardId) })),

    // List actions
    addList: (list: BoardList) => set((state: AppState) => ({ lists: [...state.lists, list] })),
    updateList: (list: BoardList) => set((state: AppState) => ({ lists: state.lists.map((l: BoardList) => (l.id === list.id ? list : l)) })),
    removeList: (listId: string) => set((state: AppState) => ({ lists: state.lists.filter((l: BoardList) => l.id !== listId) })),

    // Card actions
    addCard: (card: BoardCard) => set((state: AppState) => ({ cards: [...state.cards, card] })),
    updateCard: (card: BoardCard) => set((state: AppState) => ({ cards: state.cards.map((c: BoardCard) => (c.id === card.id ? card : c)) })),
    removeCard: (cardId: string) => set((state: AppState) => ({ cards: state.cards.filter((c: BoardCard) => c.id !== cardId) })),

        // Queue actions
    enqueueBoardAction: (action: VioletKanbanAction) => set((state: AppState) => ({ boardActionQueue: squashQueueActions(state.boardActionQueue, action) })),
    enqueueListAction: (action: VioletKanbanAction) => set((state: AppState) => ({ listActionQueue: squashQueueActions(state.listActionQueue, action) })),
    enqueueCardAction: (action: VioletKanbanAction) => set((state: AppState) => ({ cardActionQueue: squashQueueActions(state.cardActionQueue, action) })),
    dequeueBoardAction: () => set((state: AppState) => ({ boardActionQueue: state.boardActionQueue.slice(1) })),
    dequeueListAction: () => set((state: AppState) => ({ listActionQueue: state.listActionQueue.slice(1) })),
    dequeueCardAction: () => set((state: AppState) => ({ cardActionQueue: state.cardActionQueue.slice(1) })),

        // Process actions with conflict detection
        processBoardAction: (action: VioletKanbanAction) => {
            const boardId = getActionItemId(action);
            let isStale = false;
            if (isBoardActionStale(action, get)) {
                isStale = true;
            }
            if (action.type === 'delete-board' && boardId) {
                set((state: AppState) => ({
                    lists: state.lists.filter(
                        (list) => {
                            if (!list) return true;
                            const bId = (list as unknown as { boardId?: unknown }).boardId;
                            return !(typeof bId === 'string' && bId === boardId);
                        }
                    ),
                    orphanedCards: [
                        ...(state.orphanedCards ?? []),
                        ...state.cards.filter((card) => {
                            if (!card) return false;
                            const bId = (card as unknown as { boardId?: unknown }).boardId;
                            return typeof bId === 'string' && bId === boardId;
                        }),
                    ],
                }));
            }
            if (isStale) {
                set((state: AppState) => ({
                    staleBoardActions: [
                        ...(state.staleBoardActions || []),
                        action,
                    ],
                    boardActionQueue: state.boardActionQueue.filter((a) => a !== action),
                }));
            } else {
                set((state: AppState) => ({
                    boardActionQueue: squashQueueActions(state.boardActionQueue, action),
                }));
            }
        },
        processListAction: (action: VioletKanbanAction) => {
            const listId = getActionItemId(action);
            let isStale = false;
            let missingBoard = false;
            let boardId: string | undefined;
            if ('payload' in action) {
                const payload = action.payload as unknown;
                    if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>) && (payload as Record<string, unknown>).data) {
                        const data = ((payload as Record<string, unknown>).data) as Partial<BoardList>;
                        if ('boardId' in data && typeof data.boardId === 'string') {
                            boardId = data.boardId;
                        }
                    } else if (payload && typeof payload === 'object') {
                        const p = payload as Record<string, unknown>;
                        if (typeof p.boardId === 'string') boardId = p.boardId as string;
                    }
            }
            if (boardId && !get().boards.some((b) => (b as { id: string }).id === boardId)) {
                missingBoard = true;
                isStale = true;
            }
            if (isListActionStale(action, get)) {
                isStale = true;
            }
            if (action.type === 'delete-list' && listId) {
                set((state: AppState) => ({ cards: state.cards.map((card: BoardCard) => (card.listId === listId ? { ...card, listId: null } : card)) }));
            }
            if (isStale) {
                set((state: AppState) => ({
                    staleListActions: [
                        ...(state.staleListActions || []),
                        { ...action, meta: { missingBoard } },
                    ],
                    listActionQueue: state.listActionQueue.filter((a) => a !== action),
                }));
            } else {
                set((state: AppState) => ({ listActionQueue: squashQueueActions(state.listActionQueue, action) }));
            }
        },
        processCardAction: (action: VioletKanbanAction) => {
            const cardId = getActionItemId(action);
            let isStale = false;
            let missingBoard = false;
            let missingList = false;
            let boardId: string | undefined;
            let listId: string | undefined;
            if ('payload' in action) {
                if ('data' in action.payload && (action.payload as any).data) {
                    const data = (action.payload as any).data as Partial<BoardCard>;
                    if ('boardId' in data && typeof data.boardId === 'string') {
                        boardId = data.boardId;
                    }
                    if ('listId' in data && typeof data.listId === 'string') {
                        listId = data.listId;
                    }
                } else {
                    const payload = action.payload as unknown;
                    if (payload && typeof payload === 'object') {
                        const p = payload as Record<string, unknown>;
                        if (typeof p.boardId === 'string') boardId = p.boardId as string;
                        if (typeof p.listId === 'string') listId = p.listId as string;
                    }
                }
            }
            if (boardId && !get().boards.some((b) => (b as { id: string }).id === boardId)) {
                missingBoard = true;
                isStale = true;
            }
            if (listId && !get().lists.some((l) => (l as { id: string }).id === listId)) {
                missingList = true;
                isStale = true;
            }
            if (isCardActionStale(action, get)) {
                isStale = true;
            }
            if (isStale) {
                set((state: AppState) => ({
                    staleCardActions: [
                        ...(state.staleCardActions || []),
                        { ...action, meta: { missingBoard, missingList } },
                    ],
                    cardActionQueue: state.cardActionQueue.filter((a) => a !== action),
                }));
            } else {
                set((state: AppState) => ({ cardActionQueue: squashQueueActions(state.cardActionQueue, action) }));
            }
        },

        // Action to recover or reassign orphaned cards
        recoverOrphanedCard: (cardId: string, newBoardId: string) =>
            set((state: AppState) => ({ orphanedCards: (state.orphanedCards ?? []).filter((card) => card.id !== cardId), cards: state.cards.map((card) => (card.id === cardId ? { ...card, boardId: newBoardId } : card)) })),
    });

    if (persistEnabled) {
        return create<AppState>()(
            persist(creator, { name: 'violet-kanban-storage' })
        );
    }
    return create<AppState>()(creator);
}

let _appStore: import('zustand').UseBoundStore<StoreApi<AppState>> | null =
    null;
export function getOrCreateAppStore(): import('zustand').UseBoundStore<
    StoreApi<AppState>
> {
    if (!_appStore) {
        const persistEnabled = typeof window !== 'undefined';
        _appStore = createAppStore(persistEnabled);
    }
    return _appStore;
}

export const useAppStore = getOrCreateAppStore();
