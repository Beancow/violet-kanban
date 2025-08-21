import { create, StoreApi, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BoardCard } from '../types/appState.type';
import type { PartialWithRequiredId } from '@/types/utilityTypes';
import { buildPatch } from '@/utils/patchHelpers';
import { isUseBoundStore } from './factoryHelpers';

export interface CardState {
    cards: BoardCard[];
    orphanedCards?: BoardCard[];
    addCard: (card: BoardCard) => void;
    updateCard: (card: PartialWithRequiredId<BoardCard>) => void;
    removeCard: (cardId: string) => void;
    markCardOrphaned: (cardId: string) => void;
}

export function createCardStore(persistEnabled = true): StoreApi<CardState> {
    const creator: StateCreator<CardState> = function (set, _get) {
        return {
            cards: [],
            orphanedCards: [],
            addCard(card: BoardCard) {
                set((state: CardState) => ({ cards: [...state.cards, card] }));
            },
            updateCard(card: PartialWithRequiredId<BoardCard>) {
                set((state: CardState) => {
                    const patch = buildPatch<BoardCard>(card);
                    return {
                        cards: state.cards.map((c: BoardCard) =>
                            c.id === card.id
                                ? ({ ...c, ...patch } as BoardCard)
                                : c
                        ),
                    };
                });
            },
            removeCard(cardId: string) {
                set((state: CardState) => ({
                    cards: state.cards.filter((c) => c.id !== cardId),
                }));
            },
            markCardOrphaned(cardId: string) {
                set((state: CardState) => ({
                    orphanedCards: [
                        ...(state.orphanedCards ?? []),
                        ...state.cards.filter((card) => card.id === cardId),
                    ],
                }));
            },
        };
    };

    if (persistEnabled) {
        return create<CardState>()(
            persist(creator, { name: 'violet-kanban-card-storage' })
        ) as unknown as StoreApi<CardState>;
    }
    return create<CardState>()(creator) as unknown as StoreApi<CardState>;
}

let _cardStore: StoreApi<CardState> | null = null;

/**
 * Initialize the global card store. Call from a client-only provider (e.g. CardStoreProvider).
 * Tests can also call this with `persistEnabled = false` to avoid persistence.
 */
export function initializeCardStore(
    persistEnabled = typeof window !== 'undefined'
) {
    if (!_cardStore) {
        _cardStore = createCardStore(
            persistEnabled
        ) as unknown as StoreApi<CardState>;
    }
    return _cardStore;
}

/** Returns the StoreApi if initialized, otherwise null. */
export function getCardStoreIfReady(): StoreApi<CardState> | null {
    return _cardStore;
}

/**
 * Strict getter: throws if the store hasn't been initialized. This makes
 * incorrect server-side or early calls fail fast and encourages explicit
 * initialization inside a client provider.
 */
export function getOrCreateCardStore(): StoreApi<CardState> {
    if (!_cardStore) {
        throw new Error(
            'Card store not initialized. Call initializeCardStore() from CardStoreProvider before using non-React APIs.'
        );
    }
    return _cardStore;
}

/**
 * Factory for tests: create a fresh store instance without touching the global singleton.
 */
export function createCardStoreForTest() {
    return createCardStore(false);
}

export const useCardStore: import('zustand').UseBoundStore<
    StoreApi<CardState>
> = ((...args: Array<unknown>) => {
    const store = getOrCreateCardStore();
    if (isUseBoundStore<CardState>(store)) {
        const selector = (args.length > 0 ? args[0] : undefined) as
            | ((s: CardState) => unknown)
            | undefined;
        return (
            store as unknown as (
                selector?: (s: CardState) => unknown
            ) => unknown
        )(selector);
    }
    const selector = args[0] as unknown;
    const storeApi = store as StoreApi<CardState>;
    if (typeof selector === 'function') {
        return (selector as (s: CardState) => unknown)(storeApi.getState());
    }
    return storeApi.getState();
}) as unknown as import('zustand').UseBoundStore<StoreApi<CardState>>;
