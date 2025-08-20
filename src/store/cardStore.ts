import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BoardCard } from '../types/appState.type';
import { reconcileTempId } from './helpers';

export interface CardState {
    cards: BoardCard[];
    addCard: (card: BoardCard) => void;
    updateCard: (card: BoardCard) => void;
    removeCard: (cardId: string) => void;
    orphanedCards?: BoardCard[];
    markCardOrphaned: (cardId: string) => void;
    reconcileCardTempId: (tempId: string, realId: string) => void;
}

export const useCardStore = create<CardState>()(
    persist(
        (set, get) => ({
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
            reconcileCardTempId: (tempId, realId) =>
                set((state) => ({
                    cards: reconcileTempId(state.cards, tempId, realId),
                    orphanedCards: reconcileTempId(
                        state.orphanedCards ?? [],
                        tempId,
                        realId
                    ),
                })),
        }),
        { name: 'violet-kanban-card-storage' }
    )
);
