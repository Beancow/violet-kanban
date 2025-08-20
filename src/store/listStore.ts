import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BoardList } from '../types/appState.type';
import { useCardStore } from './cardStore';
import { reconcileTempId } from './helpers';

export interface ListState {
    lists: BoardList[];
    addList: (list: BoardList) => void;
    updateList: (list: BoardList) => void;
    removeList: (listId: string) => void;
    reconcileListTempId: (tempId: string, realId: string) => void;
}

export const useListStore = create<ListState>()(
    persist(
        (set, get) => ({
            lists: [],
            addList: (list) =>
                set((state) => ({ lists: [...state.lists, list] })),
            updateList: (list) =>
                set((state) => ({
                    lists: state.lists.map((l) =>
                        l.id === list.id ? list : l
                    ),
                })),
            removeList: (listId) => {
                set((state) => ({
                    lists: state.lists.filter((l) => l.id !== listId),
                }));
                // Set listId to null for all cards referencing this list
                useCardStore.getState().cards.forEach((card) => {
                    if (card.listId === listId) {
                        useCardStore
                            .getState()
                            .updateCard({ ...card, listId: null });
                    }
                });
            },
            reconcileListTempId: (tempId, realId) =>
                set((state) => ({
                    lists: reconcileTempId(state.lists, tempId, realId),
                })),
        }),
        { name: 'violet-kanban-list-storage' }
    )
);
