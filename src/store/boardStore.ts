import { create, StoreApi, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Board } from '../types/appState.type';
import type { PartialWithRequiredId } from '@/types/utilityTypes';
import { buildPatch } from '@/utils/patchHelpers';
import { getOrCreateListStore } from './listStore';
import { getOrCreateCardStore } from './cardStore';
import { isUseBoundStore } from './factoryHelpers';

export interface BoardState {
    boards: Board[];
    addBoard: (board: Board) => void;
    updateBoard: (board: PartialWithRequiredId<Board>) => void;
    removeBoard: (boardId: string) => void;
}

export function createBoardStore(
    persistEnabled = true
): import('zustand').StoreApi<BoardState> {
    const creator: StateCreator<BoardState> = (set, _get) => ({
        boards: [],
        addBoard: (board: Board) =>
            set((state: BoardState) => ({ boards: [...state.boards, board] })),
        updateBoard: (board: PartialWithRequiredId<Board>) =>
            set((state: BoardState) => {
                const patch = buildPatch<Board>(board);
                return {
                    boards: state.boards.map((b: Board) =>
                        b.id === board.id ? ({ ...b, ...patch } as Board) : b
                    ),
                };
            }),
        removeBoard: (boardId: string) => {
            set((state: BoardState) => ({
                boards: state.boards.filter((b: Board) => b.id !== boardId),
            }));
            // Remove lists for this board (non-React access via StoreApi)
            getOrCreateListStore()
                .getState()
                .lists.forEach((list) => {
                    if (!list) return;
                    const listObj = list as unknown as Record<string, unknown>;
                    const boardIdVal = listObj.boardId;
                    if (
                        typeof boardIdVal === 'string' &&
                        boardIdVal === boardId
                    ) {
                        const idVal = listObj.id;
                        if (typeof idVal === 'string')
                            getOrCreateListStore().getState().removeList(idVal);
                    }
                });
            // Mark cards as orphaned (non-React access via StoreApi)
            getOrCreateCardStore()
                .getState()
                .cards.forEach((card) => {
                    if (!card) return;
                    const cardObj = card as unknown as Record<string, unknown>;
                    const boardIdVal = cardObj.boardId;
                    if (
                        typeof boardIdVal === 'string' &&
                        boardIdVal === boardId
                    ) {
                        const idVal = cardObj.id;
                        if (typeof idVal === 'string')
                            getOrCreateCardStore()
                                .getState()
                                .markCardOrphaned(idVal);
                    }
                });
        },
    });

    if (persistEnabled) {
        // create returns a UseBoundStore at runtime; we'll cast to StoreApi for explicit non-React usage.
        return create<BoardState>()(
            persist(creator, { name: 'violet-kanban-board-storage' })
        ) as unknown as StoreApi<BoardState>;
    }
    return create<BoardState>()(creator) as unknown as StoreApi<BoardState>;
}

let _boardStore: StoreApi<BoardState> | null = null;

/** Initialize the global board store. Call from a client-only provider. */
export function initializeBoardStore(
    persistEnabled = typeof window !== 'undefined'
) {
    if (!_boardStore) {
        _boardStore = createBoardStore(
            persistEnabled
        ) as unknown as StoreApi<BoardState>;
    }
    return _boardStore;
}

/** Returns the StoreApi if initialized, otherwise null. */
export function getBoardStoreIfReady(): StoreApi<BoardState> | null {
    return _boardStore;
}

/**
 * Strict getter: throws if the store hasn't been initialized. This makes
 * incorrect server-side or early calls fail fast and encourages explicit
 * initialization inside a client provider.
 */
export function getOrCreateBoardStore(): StoreApi<BoardState> {
    if (!_boardStore) {
        throw new Error(
            'Board store not initialized. Call initializeBoardStore() from BoardStoreProvider before using non-React APIs.'
        );
    }
    return _boardStore;
}

/** Factory for tests: create a fresh store instance without touching the global singleton. */
export function createBoardStoreForTest() {
    return createBoardStore(false);
}

// Lazy UseBoundStore wrapper for components. This mirrors the pattern used by queueStore so
// non-React code can call `getOrCreateBoardStore()` and React components can call `useBoardStore`.
export const useBoardStore: import('zustand').UseBoundStore<
    StoreApi<BoardState>
> = ((...args: Array<unknown>) => {
    const store = getOrCreateBoardStore();
    if (isUseBoundStore<BoardState>(store)) {
        const selector = (args.length > 0 ? args[0] : undefined) as
            | ((s: BoardState) => unknown)
            | undefined;
        return (
            store as unknown as (
                selector?: (s: BoardState) => unknown
            ) => unknown
        )(selector);
    }
    const selector = args[0] as unknown;
    const storeApi = store as StoreApi<BoardState>;
    if (typeof selector === 'function') {
        return (selector as (s: BoardState) => unknown)(storeApi.getState());
    }
    return storeApi.getState();
}) as unknown as import('zustand').UseBoundStore<StoreApi<BoardState>>;
