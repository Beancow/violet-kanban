import { create, StoreApi, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Board } from '../types/appState.type';
import { useListStore } from './listStore';
import { useCardStore } from './cardStore';

export interface BoardState {
    boards: Board[];
    addBoard: (board: Board) => void;
    updateBoard: (board: Board) => void;
    removeBoard: (boardId: string) => void;
}

export function createBoardStore(
    persistEnabled = true
): import('zustand').UseBoundStore<StoreApi<BoardState>> {
    const creator: StateCreator<BoardState> = (set, _get) => ({
        boards: [],
        addBoard: (board: Board) =>
            set((state: BoardState) => ({ boards: [...state.boards, board] })),
        updateBoard: (board: Board) =>
            set((state: BoardState) => ({
                boards: state.boards.map((b: Board) =>
                    b.id === board.id ? board : b
                ),
            })),
        removeBoard: (boardId: string) => {
            set((state: BoardState) => ({
                boards: state.boards.filter((b: Board) => b.id !== boardId),
            }));
            // Remove lists for this board
            useListStore.getState().lists.forEach((list) => {
                if (!list) return;
                const boardIdVal = (list as unknown as { boardId?: unknown }).boardId;
                if (typeof boardIdVal === 'string' && boardIdVal === boardId) {
                    const idVal = (list as unknown as { id?: unknown }).id;
                    if (typeof idVal === 'string') useListStore.getState().removeList(idVal);
                }
            });
            // Mark cards as orphaned
            useCardStore.getState().cards.forEach((card) => {
                if (!card) return;
                const boardIdVal = (card as unknown as { boardId?: unknown }).boardId;
                if (typeof boardIdVal === 'string' && boardIdVal === boardId) {
                    const idVal = (card as unknown as { id?: unknown }).id;
                    if (typeof idVal === 'string') useCardStore.getState().markCardOrphaned(idVal);
                }
            });
        },
    });

    if (persistEnabled) {
        return create<BoardState>()(
            persist(creator, { name: 'violet-kanban-board-storage' })
        );
    }
    return create<BoardState>()(creator);
}

let _boardStore: import('zustand').UseBoundStore<StoreApi<BoardState>> | null =
    null;
export function getOrCreateBoardStore(): import('zustand').UseBoundStore<
    StoreApi<BoardState>
> {
    if (!_boardStore) {
        const persistEnabled = typeof window !== 'undefined';
        _boardStore = createBoardStore(persistEnabled);
    }
    return _boardStore;
}

export const useBoardStore = getOrCreateBoardStore();
