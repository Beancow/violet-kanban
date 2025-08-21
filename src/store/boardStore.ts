import { create } from 'zustand';
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

export const useBoardStore = create<BoardState>()(
    persist(
        (set, _get) => ({
            boards: [],
            addBoard: (board) =>
                set((state) => ({ boards: [...state.boards, board] })),
            updateBoard: (board) =>
                set((state) => ({
                    boards: state.boards.map((b) =>
                        b.id === board.id ? board : b
                    ),
                })),
            removeBoard: (boardId) => {
                set((state) => ({
                    boards: state.boards.filter((b) => b.id !== boardId),
                }));
                // Remove lists for this board
                useListStore.getState().lists.forEach((list) => {
                    if (list.boardId === boardId) {
                        useListStore.getState().removeList(list.id);
                    }
                });
                // Mark cards as orphaned
                useCardStore.getState().cards.forEach((card) => {
                    if (card.boardId === boardId) {
                        useCardStore.getState().markCardOrphaned(card.id);
                    }
                });
            },
        }),
        { name: 'violet-kanban-board-storage' }
    )
);
