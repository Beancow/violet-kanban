import { create, StoreApi, UseBoundStore, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BoardCard } from '../types/appState.type';

export interface CardState {
    cards: BoardCard[];
    orphanedCards?: BoardCard[];
    addCard: (card: BoardCard) => void;
    updateCard: (card: BoardCard) => void;
    removeCard: (cardId: string) => void;
    markCardOrphaned: (cardId: string) => void;
}

export function createCardStore(
    persistEnabled = true
): UseBoundStore<StoreApi<CardState>> {
    const creator: StateCreator<CardState> = function (set, _get) {
        return {
            cards: [],
            orphanedCards: [],
            addCard(card: BoardCard) {
                set((state: CardState) => ({ cards: [...state.cards, card] }));
            },
            updateCard(card: BoardCard) {
                set((state: CardState) => ({
                    cards: state.cards.map((c: BoardCard) =>
                        c.id === card.id ? card : c
                    ),
                }));
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
        );
    }
    return create<CardState>()(creator);
}

let _cardStore: UseBoundStore<StoreApi<CardState>> | null = null;
export function getOrCreateCardStore(): UseBoundStore<StoreApi<CardState>> {
    if (!_cardStore) {
        const persistEnabled = typeof window !== 'undefined';
        _cardStore = createCardStore(persistEnabled);
    }
    return _cardStore;
}

export const useCardStore = getOrCreateCardStore();
