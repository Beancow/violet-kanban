import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BoardCard } from '../types/appState.type';

export interface CardState {
    cards: BoardCard[];
    addCard: (card: BoardCard) => void;
    updateCard: (card: BoardCard) => void;
    removeCard: (cardId: string) => void;
    orphanedCards?: BoardCard[];
    markCardOrphaned: (cardId: string) => void;
}

export const useCardStore = create<CardState>()(
    persist(
        (set, _get) => ({
            cards: [],
            orphanedCards: [],
            addCard: (card) =>
                set((state) => ({ cards: [...state.cards, card] })),
            updateCard: (card) =>
                set((state) => ({
                    cards: state.cards.map((c) =>
                        c.id === card.id ? card : c
                    ),
                })),
            removeCard: (cardId) =>
                set((state) => ({
                    cards: state.cards.filter((c) => c.id !== cardId),
                })),
            markCardOrphaned: (cardId) =>
                set((state) => ({
                    orphanedCards: [
                        ...(state.orphanedCards ?? []),
                        ...state.cards.filter((card) => card.id === cardId),
                    ],
                })),
        }),
        { name: 'violet-kanban-card-storage' }
    )
);
