import { create, StoreApi, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { getActionItemId, squashQueueActions } from './helpers';
import { getOrCreateTempIdMapStore } from './tempIdMapStore';
import { useBoardStore, getBoardStoreIfReady } from './boardStore';
import { useListStore, getListStoreIfReady } from './listStore';
import { useCardStore, getCardStoreIfReady } from './cardStore';
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

function hasSetMapping(
    obj: unknown
): obj is { setMapping: (t: string, r: string) => void } {
    if (!obj || typeof obj !== 'object') return false;
    const maybe = obj as { setMapping?: unknown };
    return typeof maybe.setMapping === 'function';
}

function hasClearMapping(
    obj: unknown
): obj is { clearMapping: (t: string) => void } {
    if (!obj || typeof obj !== 'object') return false;
    const maybe = obj as { clearMapping?: unknown };
    return typeof maybe.clearMapping === 'function';
}

export interface QueueState {
    boardActionQueue: VioletKanbanAction[];
    listActionQueue: VioletKanbanAction[];
    cardActionQueue: VioletKanbanAction[];
    // low-level enqueuers that accept a fully-built VioletKanbanAction
    enqueueBoardAction: (action: VioletKanbanAction) => void;
    enqueueListAction: (action: VioletKanbanAction) => void;
    // helpers to remove a processed action by its item id
    removeBoardAction: (actionId: string) => void;
    removeListAction: (actionId: string) => void;
    removeCardAction: (actionId: string) => void;
    // convenience: accept a Board domain object and enqueue create-or-update
    enqueueBoardCreateOrUpdate: (data: Board) => void;
    // enqueueListAction accepts a fully-built VioletKanbanAction
    enqueueListCreateOrUpdate: (data: BoardList) => void;
    // For create/update: enqueueCardCreateOrUpdate accepts a `BoardCard` object (may include id for updates)
    enqueueCardCreateOrUpdate: (data: BoardCard) => void;
    // Move/delete have dedicated helpers
    enqueueCardDelete: (id: string) => void;
    enqueueListDelete: (id: string) => void;
    enqueueBoardDelete: (id: string) => void;
    enqueueCardMove: (payload: {
        id: string;
        newIndex: number;
        listId: string;
        boardId?: string;
    }) => void;
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
            | {
                  setMapping: (t: string, r: string) => void;
                  clearMapping: (t: string) => void;
              }
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
        if (adapter && typeof adapter.addBoard === 'function')
            adapter.addBoard(board);
    };

    const addListFn = (list: BoardList) => {
        if (!listStoreInstance) return;
        const api = getStoreApi<ListState>(listStoreInstance);
        if (api) {
            api.getState().addList(list);
            return;
        }
        const adapter = listStoreInstance as ListStoreAdapter;
        if (adapter && typeof adapter.addList === 'function')
            adapter.addList(list);
    };

    const addCardFn = (card: BoardCard) => {
        if (!cardStoreInstance) return;
        const api = getStoreApi<CardState>(cardStoreInstance);
        if (api) {
            api.getState().addCard(card);
            return;
        }
        const adapter = cardStoreInstance as CardStoreAdapter;
        if (adapter && typeof adapter.addCard === 'function')
            adapter.addCard(card);
    };

    const creator: StateCreator<QueueState> = (set, _get) => {
        // Helper to build a create or update VioletKanbanAction for boards/lists/cards
        const buildCreateOrUpdateAction = (
            entity: 'board' | 'list' | 'card',
            payload: {
                data: Record<string, unknown>;
            }
        ): VioletKanbanAction => {
            const idCandidate = (payload.data as Record<string, unknown>)?.id;
            // create (temp id present or missing)
            if (
                (typeof idCandidate === 'string' &&
                    idCandidate.startsWith('temp-')) ||
                !idCandidate
            ) {
                const tempId =
                    (idCandidate as string) ||
                    `${entity}-temp-${Date.now()}-${Math.random()
                        .toString(36)
                        .slice(2)}`;
                const createData = { ...payload.data } as Record<
                    string,
                    unknown
                >;
                delete (createData as Record<string, unknown>).id;
                if (entity === 'board') {
                    return {
                        type: 'create-board',
                        payload: { data: createData, tempId },
                        timestamp: Date.now(),
                    } as VioletKanbanAction;
                }
                if (entity === 'list') {
                    // ensure boardId is present in create data (may be inside payload.data)
                    (createData as Record<string, unknown>).boardId =
                        (payload.data as Record<string, unknown>).boardId ?? '';
                    return {
                        type: 'create-list',
                        payload: { data: createData, tempId },
                        timestamp: Date.now(),
                    } as VioletKanbanAction;
                }
                // card
                // card: move boardId/listId into data
                (createData as Record<string, unknown>).boardId =
                    (payload.data as Record<string, unknown>).boardId ?? '';
                (createData as Record<string, unknown>).listId =
                    (payload.data as Record<string, unknown>).listId ?? '';
                return {
                    type: 'create-card',
                    payload: { data: createData, tempId },
                    timestamp: Date.now(),
                } as VioletKanbanAction;
            }

            // otherwise update
            if (entity === 'board') {
                return {
                    type: 'update-board',
                    payload: { data: payload.data },
                    timestamp: Date.now(),
                } as VioletKanbanAction;
            }
            if (entity === 'list') {
                return {
                    type: 'update-list',
                    payload: { data: payload.data },
                    timestamp: Date.now(),
                } as VioletKanbanAction;
            }
            return {
                type: 'update-card',
                payload: { data: payload.data },
                timestamp: Date.now(),
            } as VioletKanbanAction;
        };
        // Return the store shape matching QueueState
        return {
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

            enqueueBoardCreateOrUpdate: (data: Board) =>
                set((state: QueueState) => {
                    const actionToEnqueue = buildCreateOrUpdateAction('board', {
                        data: data as unknown as Record<string, unknown>,
                    });
                    return {
                        boardActionQueue: squashQueueActions(
                            state.boardActionQueue,
                            actionToEnqueue
                        ),
                    };
                }),

            // thin API for components: accept a BoardCard object; empty id ('') is treated as create
            enqueueCardCreateOrUpdate: (data: BoardCard) =>
                set((state: QueueState) => {
                    const actionToEnqueue = buildCreateOrUpdateAction('card', {
                        data: data as unknown as Record<string, unknown>,
                    });
                    return {
                        cardActionQueue: squashQueueActions(
                            state.cardActionQueue,
                            actionToEnqueue
                        ),
                    };
                }),

            enqueueCardDelete: (id: string) =>
                set((state: QueueState) => ({
                    cardActionQueue: squashQueueActions(state.cardActionQueue, {
                        type: 'delete-card',
                        payload: { data: { id } },
                        timestamp: Date.now(),
                    } as VioletKanbanAction),
                })),

            enqueueListDelete: (id: string) =>
                set((state: QueueState) => ({
                    listActionQueue: squashQueueActions(state.listActionQueue, {
                        type: 'delete-list',
                        payload: { data: { id } },
                        timestamp: Date.now(),
                    } as VioletKanbanAction),
                })),

            enqueueBoardDelete: (id: string) =>
                set((state: QueueState) => ({
                    boardActionQueue: squashQueueActions(
                        state.boardActionQueue,
                        {
                            type: 'delete-board',
                            payload: { data: { id } },
                            timestamp: Date.now(),
                        } as VioletKanbanAction
                    ),
                })),

            enqueueListAction: (action: VioletKanbanAction) =>
                set((state: QueueState) => ({
                    listActionQueue: squashQueueActions(
                        state.listActionQueue,
                        action
                    ),
                })),

            enqueueListCreateOrUpdate: (data: BoardList) =>
                set((state: QueueState) => {
                    const actionToEnqueue = buildCreateOrUpdateAction('list', {
                        data: data as unknown as Record<string, unknown>,
                    });
                    return {
                        listActionQueue: squashQueueActions(
                            state.listActionQueue,
                            actionToEnqueue
                        ),
                    };
                }),

            enqueueCardMove: (payload: {
                id: string;
                newIndex: number;
                listId: string;
                boardId?: string;
            }) =>
                set((state: QueueState) => ({
                    cardActionQueue: squashQueueActions(state.cardActionQueue, {
                        type: 'move-card',
                        payload: {
                            id: payload.id,
                            newIndex: payload.newIndex,
                            listId: payload.listId,
                            boardId: payload.boardId ?? '',
                        },
                        timestamp: Date.now(),
                    } as VioletKanbanAction),
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
                const tempMap =
                    options && options.tempIdMapStore
                        ? options.tempIdMapStore
                        : getOrCreateTempIdMapStore();
                const tempApi = getStoreApi<TempIdMapState>(tempMap);
                if (tempApi) {
                    tempApi.getState().setMapping(tempId, realId);
                } else if (hasSetMapping(tempMap)) {
                    tempMap.setMapping(tempId, realId);
                }

                addBoardFn(newBoard);

                set((state: QueueState) => ({
                    boardActionQueue: state.boardActionQueue.filter(
                        (action: VioletKanbanAction) =>
                            getActionItemId(action) !== tempId
                    ),
                }));

                if (tempApi) {
                    tempApi.getState().clearMapping(tempId);
                } else if (hasClearMapping(tempMap)) {
                    tempMap.clearMapping(tempId);
                }
            },

            handleListActionSuccess: (
                tempId: string | undefined,
                newList: BoardList
            ) => {
                if (!tempId) return;
                const realId = newList.id;
                const tempMap =
                    options && options.tempIdMapStore
                        ? options.tempIdMapStore
                        : getOrCreateTempIdMapStore();
                const tempApi = getStoreApi<TempIdMapState>(tempMap);
                if (tempApi) {
                    tempApi.getState().setMapping(tempId, realId);
                } else if (hasSetMapping(tempMap)) {
                    tempMap.setMapping(tempId, realId);
                }

                addListFn(newList);

                set((state: QueueState) => ({
                    listActionQueue: state.listActionQueue.filter(
                        (action: VioletKanbanAction) =>
                            getActionItemId(action) !== tempId
                    ),
                }));

                if (tempApi) {
                    tempApi.getState().clearMapping(tempId);
                } else if (hasClearMapping(tempMap)) {
                    tempMap.clearMapping(tempId);
                }
            },

            handleCardActionSuccess: (
                tempId: string | undefined,
                newCard: BoardCard
            ) => {
                if (!tempId) return;
                const realId = newCard.id;
                const tempMap =
                    options && options.tempIdMapStore
                        ? options.tempIdMapStore
                        : getOrCreateTempIdMapStore();
                const tempApi = getStoreApi<TempIdMapState>(tempMap);
                if (tempApi) {
                    tempApi.getState().setMapping(tempId, realId);
                } else if (hasSetMapping(tempMap)) {
                    tempMap.setMapping(tempId, realId);
                }

                addCardFn(newCard);

                set((state: QueueState) => ({
                    cardActionQueue: state.cardActionQueue.filter(
                        (action: VioletKanbanAction) =>
                            getActionItemId(action) !== tempId
                    ),
                }));

                if (tempApi) {
                    tempApi.getState().clearMapping(tempId);
                } else if (hasClearMapping(tempMap)) {
                    tempMap.clearMapping(tempId);
                }
            },
        };
    };

    if (persistEnabled) {
        return create<QueueState>()(
            persist(creator, { name: 'violet-kanban-queue-storage' })
        );
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
