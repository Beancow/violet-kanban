import { create, StoreApi, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { getActionItemId, squashQueueActions } from './helpers';
import { getOrCreateTempIdMapStore } from './tempIdMapStore';
import {
    getOrCreateBoardStore,
    useBoardStore,
    getBoardStoreIfReady,
} from './boardStore';
import {
    getOrCreateListStore,
    useListStore,
    getListStoreIfReady,
} from './listStore';
import {
    getOrCreateCardStore,
    useCardStore,
    getCardStoreIfReady,
} from './cardStore';
import {
    isUseBoundStore,
    BoardStoreAdapter,
    ListStoreAdapter,
    CardStoreAdapter,
    getStoreApi,
} from './factoryHelpers';
import type { BoardState } from './boardStore';
import type { ListState } from './listStore';
import type { CardState } from './cardStore';
import type { Board, BoardList, BoardCard } from '../types/appState.type';
import type { VioletKanbanAction } from './appStore';
import type { TempIdMapState } from './tempIdMapStore';

// Minimal adapter type and runtime guards for injected temp id map objects used in tests.
type MinimalTempIdMapAdapter = {
    setMapping?: (t: string, r: string) => void;
    clearMapping?: (t: string) => void;
};

function hasSetMapping(obj: unknown): obj is { setMapping: (t: string, r: string) => void } {
    if (!obj || typeof obj !== 'object') return false;
    const maybe = obj as { setMapping?: unknown };
    return typeof maybe.setMapping === 'function';
}

function hasClearMapping(obj: unknown): obj is { clearMapping: (t: string) => void } {
    if (!obj || typeof obj !== 'object') return false;
    const maybe = obj as { clearMapping?: unknown };
    return typeof maybe.clearMapping === 'function';
}

export interface QueueState {
    boardActionQueue: VioletKanbanAction[];
    listActionQueue: VioletKanbanAction[];
    cardActionQueue: VioletKanbanAction[];
    enqueueBoardAction: (action: VioletKanbanAction) => void;
    enqueueListAction: (action: VioletKanbanAction) => void;
    enqueueCardAction: (action: VioletKanbanAction) => void;
    removeBoardAction: (actionId: string) => void;
    removeListAction: (actionId: string) => void;
    removeCardAction: (actionId: string) => void;
    handleBoardActionSuccess: (
        tempId: string | undefined,
        newBoard: Board
    ) => void;
    handleListActionSuccess: (
        tempId: string | undefined,
        newList: BoardList
    ) => void;
    handleCardActionSuccess: (
        tempId: string | undefined,
        newCard: BoardCard
    ) => void;
}

export function createQueueStore(
    persistEnabled = true,
    options?: {
        boardStore?: BoardStoreAdapter | ReturnType<typeof useBoardStore>;
        listStore?: ListStoreAdapter | ReturnType<typeof useListStore>;
        cardStore?: CardStoreAdapter | ReturnType<typeof useCardStore>;
        // optional test-injected temp id map store (can be UseBoundStore, StoreApi, or a minimal adapter)
        tempIdMapStore?:
            | ReturnType<typeof getOrCreateTempIdMapStore>
            | StoreApi<TempIdMapState>
            | { setMapping: (t: string, r: string) => void; clearMapping: (t: string) => void }
            | unknown;
    }
) {
    // If adapters are provided for testing, use them; otherwise use the runtime singletons/hooks.
    const boardStoreInstance =
        options && options.boardStore !== undefined
            ? options.boardStore
            : typeof getBoardStoreIfReady === 'function'
            ? getBoardStoreIfReady()
            : undefined;
    const listStoreInstance =
        options && options.listStore !== undefined
            ? options.listStore
            : typeof getListStoreIfReady === 'function'
            ? getListStoreIfReady()
            : undefined;
    const cardStoreInstance =
        options && options.cardStore !== undefined
            ? options.cardStore
            : typeof getCardStoreIfReady === 'function'
            ? getCardStoreIfReady()
            : undefined;

    // Normalize add functions: support either a UseBoundStore (hook) or a minimal adapter object
    const addBoardFn = (board: Board) => {
        if (!boardStoreInstance) return;
        const api = getStoreApi<BoardState>(boardStoreInstance);
        if (api) {
            api.getState().addBoard(board);
            return;
        }
        const adapter = boardStoreInstance as BoardStoreAdapter;
        if (adapter && typeof adapter.addBoard === 'function') adapter.addBoard(board);
    };

    const addListFn = (list: BoardList) => {
        if (!listStoreInstance) return;
        const api = getStoreApi<ListState>(listStoreInstance);
        if (api) {
            api.getState().addList(list);
            return;
        }
        const adapter = listStoreInstance as ListStoreAdapter;
        if (adapter && typeof adapter.addList === 'function') adapter.addList(list);
    };

    const addCardFn = (card: BoardCard) => {
        if (!cardStoreInstance) return;
        const api = getStoreApi<CardState>(cardStoreInstance);
        if (api) {
            api.getState().addCard(card);
            return;
        }
        const adapter = cardStoreInstance as CardStoreAdapter;
        if (adapter && typeof adapter.addCard === 'function') adapter.addCard(card);
    };

    const creator: StateCreator<QueueState> = (set, _get) => ({
        boardActionQueue: [] as VioletKanbanAction[],
        listActionQueue: [] as VioletKanbanAction[],
        cardActionQueue: [] as VioletKanbanAction[],
        enqueueBoardAction: (action: VioletKanbanAction) =>
            set((state: QueueState) => ({
                boardActionQueue: squashQueueActions(state.boardActionQueue, action),
            })),
        enqueueListAction: (action: VioletKanbanAction) =>
            set((state: QueueState) => ({
                listActionQueue: squashQueueActions(state.listActionQueue, action),
            })),
        enqueueCardAction: (action: VioletKanbanAction) =>
            set((state: QueueState) => ({
                cardActionQueue: squashQueueActions(state.cardActionQueue, action),
            })),
        removeBoardAction: (actionId: string) =>
            set((state: QueueState) => ({
                boardActionQueue: state.boardActionQueue.filter(
                    (action: VioletKanbanAction) => getActionItemId(action) !== actionId
                ),
            })),
        removeListAction: (actionId: string) =>
            set((state: QueueState) => ({
                listActionQueue: state.listActionQueue.filter(
                    (action: VioletKanbanAction) => getActionItemId(action) !== actionId
                ),
            })),
        removeCardAction: (actionId: string) =>
            set((state: QueueState) => ({
                cardActionQueue: state.cardActionQueue.filter(
                    (action: VioletKanbanAction) => getActionItemId(action) !== actionId
                ),
            })),
        handleBoardActionSuccess: (tempId: string | undefined, newBoard: Board) => {
            if (!tempId) return;
            const realId = newBoard.id;
            // Update tempId map so other parts can look up the real id
            const tempMap = options && options.tempIdMapStore ? options.tempIdMapStore : getOrCreateTempIdMapStore();
            const tempApi = getStoreApi<TempIdMapState>(tempMap);
            if (tempApi) {
                tempApi.getState().setMapping(tempId, realId);
            } else if (hasSetMapping(tempMap)) {
                tempMap.setMapping(tempId, realId);
            }

            // Move the created board into the real store (ensure no duplicates)
            addBoardFn(newBoard);

            // Remove queued actions that referenced the tempId
            set((state: QueueState) => ({
                boardActionQueue: state.boardActionQueue.filter(
                    (action: VioletKanbanAction) => getActionItemId(action) !== tempId
                ),
            }));

            // Clear temp map for this id
            if (tempApi) {
                tempApi.getState().clearMapping(tempId);
            } else if (hasClearMapping(tempMap)) {
                tempMap.clearMapping(tempId);
            }
        },
        handleListActionSuccess: (tempId: string | undefined, newList: BoardList) => {
            if (!tempId) return;
            const realId = newList.id;
            const tempMap = options && options.tempIdMapStore ? options.tempIdMapStore : getOrCreateTempIdMapStore();
            const tempApi = getStoreApi<TempIdMapState>(tempMap);
            if (tempApi) {
                tempApi.getState().setMapping(tempId, realId);
            } else if (hasSetMapping(tempMap)) {
                tempMap.setMapping(tempId, realId);
            }

            // Add the real list
            addListFn(newList);

            // Remove queued actions that referenced the tempId
            set((state: QueueState) => ({
                listActionQueue: state.listActionQueue.filter(
                    (action: VioletKanbanAction) => getActionItemId(action) !== tempId
                ),
            }));

            // Clear mapping
            if (tempApi) {
                tempApi.getState().clearMapping(tempId);
            } else if (hasClearMapping(tempMap)) {
                tempMap.clearMapping(tempId);
            }
        },
        handleCardActionSuccess: (tempId: string | undefined, newCard: BoardCard) => {
            if (!tempId) return;
            const realId = newCard.id;
            const tempMap = options && options.tempIdMapStore ? options.tempIdMapStore : getOrCreateTempIdMapStore();
            const tempApi = getStoreApi<TempIdMapState>(tempMap);
            if (tempApi) {
                tempApi.getState().setMapping(tempId, realId);
            } else if (hasSetMapping(tempMap)) {
                tempMap.setMapping(tempId, realId);
            }

            // Add the real card
            addCardFn(newCard);

            // Remove queued actions that referenced the tempId
            set((state: QueueState) => ({
                cardActionQueue: state.cardActionQueue.filter(
                    (action: VioletKanbanAction) => getActionItemId(action) !== tempId
                ),
            }));

            // Clear mapping
            if (tempApi) {
                tempApi.getState().clearMapping(tempId);
            } else if (hasClearMapping(tempMap)) {
                tempMap.clearMapping(tempId);
            }
        },
    });

    if (persistEnabled) {
        return create<QueueState>()(persist(creator, { name: 'violet-kanban-queue-storage' }));
    }

    return create<QueueState>()(creator);
}

let _queueStore: StoreApi<QueueState> | null = null;

export function initializeQueueStore(
    persistEnabled = typeof window !== 'undefined'
) {
    if (!_queueStore) {
        _queueStore = createQueueStore(
            persistEnabled
        ) as unknown as StoreApi<QueueState>;
    }
    return _queueStore;
}

export function getQueueStoreIfReady(): StoreApi<QueueState> | null {
    return _queueStore;
}

export function getOrCreateQueueStore(): StoreApi<QueueState> {
    if (!_queueStore) {
        throw new Error(
            'Queue store not initialized. Call initializeQueueStore() from QueueStoreProvider before using non-React APIs.'
        );
    }
    return _queueStore;
}

export function createQueueStoreForTest() {
    return createQueueStore(false);
}

// Lazy, typed proxy for useQueueStore. We use the runtime type guard `isUseBoundStore`
// when invoking the underlying store to avoid blind casts.
export const useQueueStore: import('zustand').UseBoundStore<
    StoreApi<QueueState>
> = ((...args: Array<unknown>) => {
    const store = getOrCreateQueueStore();
    // If the underlying object is a UseBoundStore (callable), call it with the selector.
    if (isUseBoundStore<QueueState>(store)) {
        const selector = (args.length > 0 ? args[0] : undefined) as
            | ((s: QueueState) => unknown)
            | undefined;
        // store is a callable UseBoundStore at runtime, invoke with selector
        return (
            store as unknown as (
                selector?: (s: QueueState) => unknown
            ) => unknown
        )(selector);
    }
    // Fallback: treat as StoreApi and run selector against getState()
    const selector = args[0] as unknown;
    const storeApi = store as StoreApi<QueueState>;
    if (typeof selector === 'function') {
        return (selector as (s: QueueState) => unknown)(storeApi.getState());
    }
    return storeApi.getState();
}) as unknown as import('zustand').UseBoundStore<StoreApi<QueueState>>;

// Expose helper methods commonly used outside React (e.g., syncManager)
// Note: we intentionally do NOT attach getState/setState/subscribe helpers onto `useQueueStore`.
// Non-React code should call `getOrCreateQueueStore()` explicitly and use the returned StoreApi<QueueState>.
