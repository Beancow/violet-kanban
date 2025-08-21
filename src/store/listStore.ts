import { create, StoreApi, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BoardList } from '../types/appState.type';
import { useCardStore } from './cardStore';

export interface ListState {
    lists: BoardList[];
    addList: (list: BoardList) => void;
    updateList: (list: BoardList) => void;
    removeList: (listId: string) => void;
}

export function createListStore(
    persistEnabled = true
): import('zustand').UseBoundStore<StoreApi<ListState>> {
    const creator: StateCreator<ListState> = (set, _get) => ({
        lists: [],
        addList: (list: BoardList) =>
            set((state: ListState) => ({ lists: [...state.lists, list] })),
        updateList: (list: BoardList) =>
            set((state: ListState) => ({
                lists: state.lists.map((l: BoardList) =>
                    l.id === list.id ? list : l
                ),
            })),
        removeList: (listId: string) => {
            set((state: ListState) => ({
                lists: state.lists.filter((l) => l.id !== listId),
            }));
            // Set listId to null for all cards referencing this list
            useCardStore.getState().cards.forEach((card) => {
                if (!card) return;
                const listIdVal = (card as unknown as { listId?: unknown }).listId;
                if (typeof listIdVal === 'string' && listIdVal === listId) {
                    const idVal = (card as unknown as { id?: unknown }).id;
                    const partial: Partial<import('../types/appState.type').BoardCard> = {
                        ...(card as object as Record<string, unknown>),
                        listId: null,
                    };
                    if (typeof idVal === 'string') useCardStore.getState().updateCard(partial as any);
                }
            });
        },
    });

    if (persistEnabled) {
        return create<ListState>()(
            persist(creator, { name: 'violet-kanban-list-storage' })
        );
    }
    return create<ListState>()(creator);
}

let _listStore: import('zustand').UseBoundStore<StoreApi<ListState>> | null =
    null;
export function getOrCreateListStore(): import('zustand').UseBoundStore<
    StoreApi<ListState>
> {
    if (!_listStore) {
        const persistEnabled = typeof window !== 'undefined';
        _listStore = createListStore(persistEnabled);
    }
    return _listStore;
}

export const useListStore = getOrCreateListStore();
