import { create, StoreApi, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BoardList } from '../types/appState.type';
import { getOrCreateCardStore } from './cardStore';

import type { PartialWithRequiredId } from '@/types/utilityTypes';
import { buildPatch } from '@/utils/patchHelpers';
import { isUseBoundStore } from './factoryHelpers';
export interface ListState {
    lists: BoardList[];
    addList: (list: BoardList) => void;
    updateList: (list: PartialWithRequiredId<BoardList>) => void;
    removeList: (listId: string) => void;
}

export function createListStore(
    persistEnabled = true
): import('zustand').StoreApi<ListState> {
    const creator: StateCreator<ListState> = (set, _get) => ({
        lists: [],
        addList: (list: BoardList) =>
            set((state: ListState) => ({ lists: [...state.lists, list] })),
        updateList: (list: PartialWithRequiredId<BoardList>) =>
            set((state: ListState) => {
                const patch = buildPatch<BoardList>(list);
                return {
                    lists: state.lists.map((l: BoardList) =>
                        l.id === list.id ? ({ ...l, ...patch } as BoardList) : l
                    ),
                };
            }),
        removeList: (listId: string) => {
            set((state: ListState) => ({
                lists: state.lists.filter((l) => l.id !== listId),
            }));
            // Set listId to null for all cards referencing this list (non-React access)
            getOrCreateCardStore()
                .getState()
                .cards.forEach((card) => {
                    if (!card) return;
                    const cardObj = card as unknown as Record<string, unknown>;
                    const listIdVal = cardObj.listId;
                    if (typeof listIdVal === 'string' && listIdVal === listId) {
                        const idVal = cardObj.id;
                        const partial = buildPatch<
                            import('../types/appState.type').BoardCard
                        >(
                            {
                                ...(cardObj as Record<string, unknown>),
                                listId: null,
                            },
                            ['listId']
                        );
                        if (typeof idVal === 'string')
                            getOrCreateCardStore()
                                .getState()
                                .updateCard({ id: idVal, ...partial });
                    }
                });
        },
    });

    if (persistEnabled) {
        return create<ListState>()(
            persist(creator, { name: 'violet-kanban-list-storage' })
        ) as unknown as StoreApi<ListState>;
    }
    return create<ListState>()(creator) as unknown as StoreApi<ListState>;
}

let _listStore: StoreApi<ListState> | null = null;

/** Initialize the global list store. Call from a client-only provider. */
export function initializeListStore(
    persistEnabled = typeof window !== 'undefined'
) {
    if (!_listStore) {
        _listStore = createListStore(
            persistEnabled
        ) as unknown as StoreApi<ListState>;
    }
    return _listStore;
}

/** Returns the StoreApi if initialized, otherwise null. */
export function getListStoreIfReady(): StoreApi<ListState> | null {
    return _listStore;
}

/**
 * Strict getter: throws if the store hasn't been initialized. This makes
 * incorrect server-side or early calls fail fast and encourages explicit
 * initialization inside a client provider.
 */
export function getOrCreateListStore(): StoreApi<ListState> {
    if (!_listStore) {
        throw new Error(
            'List store not initialized. Call initializeListStore() from ListStoreProvider before using non-React APIs.'
        );
    }
    return _listStore;
}

/** Factory for tests: create a fresh store instance without touching the global singleton. */
export function createListStoreForTest() {
    return createListStore(false);
}

export const useListStore: import('zustand').UseBoundStore<
    StoreApi<ListState>
> = ((...args: Array<unknown>) => {
    const store = getOrCreateListStore();
    if (isUseBoundStore<ListState>(store)) {
        const selector = (args.length > 0 ? args[0] : undefined) as
            | ((s: ListState) => unknown)
            | undefined;
        return (
            store as unknown as (
                selector?: (s: ListState) => unknown
            ) => unknown
        )(selector);
    }
    const selector = args[0] as unknown;
    const storeApi = store as StoreApi<ListState>;
    if (typeof selector === 'function') {
        return (selector as (s: ListState) => unknown)(storeApi.getState());
    }
    return storeApi.getState();
}) as unknown as import('zustand').UseBoundStore<StoreApi<ListState>>;
