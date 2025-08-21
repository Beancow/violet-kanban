import { create, StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';
import { getActionItemId, squashQueueActions } from './helpers';
import { getOrCreateTempIdMapStore } from './tempIdMapStore';
import { useBoardStore } from './boardStore';
import { useListStore } from './listStore';
import { useCardStore } from './cardStore';
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
    }
): import('zustand').UseBoundStore<StoreApi<QueueState>> {
    // If adapters are provided for testing, use them; otherwise use the runtime singletons/hooks.
    const boardStoreInstance =
        options && options.boardStore !== undefined
            ? options.boardStore
            : useBoardStore();
    const listStoreInstance =
        options && options.listStore !== undefined
            ? options.listStore
            : useListStore();
    const cardStoreInstance =
        options && options.cardStore !== undefined
            ? options.cardStore
            : useCardStore();

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

    const creator: import('zustand').StateCreator<QueueState> = (
        set,
        _get
    ) => ({
        boardActionQueue: [] as VioletKanbanAction[],
        listActionQueue: [] as VioletKanbanAction[],
        cardActionQueue: [] as VioletKanbanAction[],
        enqueueBoardAction: (action: VioletKanbanAction) =>
            set((state: QueueState) => ({
                boardActionQueue: squashQueueActions(
                    state.boardActionQueue,
                    action
                ),
            })),
        enqueueListAction: (action: VioletKanbanAction) =>
            set((state: QueueState) => ({
                listActionQueue: squashQueueActions(
                    state.listActionQueue,
                    action
                ),
            })),
        enqueueCardAction: (action: VioletKanbanAction) =>
            set((state: QueueState) => ({
                cardActionQueue: squashQueueActions(
                    state.cardActionQueue,
                    action
                ),
            })),
        removeBoardAction: (actionId: string) =>
            set((state: QueueState) => ({
                boardActionQueue: state.boardActionQueue.filter(
                    (action: VioletKanbanAction) =>
                        getActionItemId(action) !== actionId
                ),
            })),
        removeListAction: (actionId: string) =>
            set((state: QueueState) => ({
                listActionQueue: state.listActionQueue.filter(
                    (action: VioletKanbanAction) =>
                        getActionItemId(action) !== actionId
                ),
            })),
        removeCardAction: (actionId: string) =>
            set((state: QueueState) => ({
                cardActionQueue: state.cardActionQueue.filter(
                    (action: VioletKanbanAction) =>
                        getActionItemId(action) !== actionId
                ),
            })),
        handleBoardActionSuccess: (
            tempId: string | undefined,
            newBoard: Board
        ) => {
            if (!tempId) return;
            const realId = newBoard.id;
            // Update tempId map so other parts can look up the real id
            getOrCreateTempIdMapStore().getState().setMapping(tempId, realId);

            // Move the created board into the real store (ensure no duplicates)
            addBoardFn(newBoard);

            // Remove queued actions that referenced the tempId
            set((state: QueueState) => ({
                boardActionQueue: state.boardActionQueue.filter(
                    (action: VioletKanbanAction) =>
                        getActionItemId(action) !== tempId
                ),
            }));

            // Clear temp map for this id
            getOrCreateTempIdMapStore().getState().clearMapping(tempId);
        },
        handleListActionSuccess: (
            tempId: string | undefined,
            newList: BoardList
        ) => {
            if (!tempId) return;
            const realId = newList.id;
            getOrCreateTempIdMapStore().getState().setMapping(tempId, realId);

            // Add the real list
            addListFn(newList);

            // Remove queued actions that referenced the tempId
            set((state: QueueState) => ({
                listActionQueue: state.listActionQueue.filter(
                    (action: VioletKanbanAction) =>
                        getActionItemId(action) !== tempId
                ),
            }));

            getOrCreateTempIdMapStore().getState().clearMapping(tempId);
        },
        handleCardActionSuccess: (
            tempId: string | undefined,
            newCard: BoardCard
        ) => {
            if (!tempId) return;
            const realId = newCard.id;
            getOrCreateTempIdMapStore().getState().setMapping(tempId, realId);

            // Add the real card
            addCardFn(newCard);

            // Remove queued actions that referenced the tempId
            set((state: QueueState) => ({
                cardActionQueue: state.cardActionQueue.filter(
                    (action: VioletKanbanAction) =>
                        getActionItemId(action) !== tempId
                ),
            }));

            getOrCreateTempIdMapStore().getState().clearMapping(tempId);
        },
    });

    if (persistEnabled) {
        return create<QueueState>()(
            persist(creator, { name: 'violet-kanban-queue-storage' })
        );
    }

    return create<QueueState>()(creator);
}

let _queueStore: import('zustand').UseBoundStore<StoreApi<QueueState>> | null =
    null;
export function getOrCreateQueueStore(): import('zustand').UseBoundStore<
    StoreApi<QueueState>
> {
    if (!_queueStore) {
        const persistEnabled = typeof window !== 'undefined';
        _queueStore = createQueueStore(persistEnabled);
    }
    return _queueStore;
}

// Lazy, typed proxy for useQueueStore. We use the runtime type guard `isUseBoundStore`
// when invoking the underlying store to avoid blind casts.
export const useQueueStore: import('zustand').UseBoundStore<StoreApi<QueueState>> = ((...args: Array<unknown>) => {
    const store = getOrCreateQueueStore();
    if (isUseBoundStore<QueueState>(store)) {
        const selector = (args.length > 0 ? args[0] : undefined) as
            | ((s: QueueState) => unknown)
            | undefined;
        return (store as (selector?: (s: QueueState) => unknown) => unknown)(selector);
    }
    // Fallback: store behaves like StoreApi, call selector against its getState()
    const selector = args[0] as unknown;
    const storeApi = store as unknown as StoreApi<QueueState>;
    if (typeof selector === 'function') {
        return (selector as (s: QueueState) => unknown)(storeApi.getState());
    }
    return storeApi.getState();
}) as unknown as import('zustand').UseBoundStore<StoreApi<QueueState>>;

// Expose helper methods commonly used outside React (e.g., syncManager)
;(useQueueStore as unknown as { getState?: unknown }).getState = () => getOrCreateQueueStore().getState();
;(useQueueStore as unknown as { setState?: unknown }).setState = (s: unknown) => getOrCreateQueueStore().setState(s as unknown as Partial<QueueState>);
;(useQueueStore as unknown as { subscribe?: unknown }).subscribe = (cb: (s: QueueState) => void) =>
    getOrCreateQueueStore().subscribe(cb as (state: QueueState) => void);
