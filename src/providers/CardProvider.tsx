'use client';
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { Draft } from 'immer';
import type { ReactNode } from 'react';
import type { BoardCard } from '../types/appState.type';
import { reducer as cardReducer } from './reducers/cardReducer';
import { registerCardAdapter } from './adapter';

type State = {
    cards: BoardCard[];
    orphanedCards?: BoardCard[];
};

type Action =
    | { type: 'ADD_CARD'; card: BoardCard }
    | { type: 'UPDATE_CARD'; card: Partial<BoardCard> & { id: string } }
    | { type: 'REMOVE_CARD'; cardId: string }
    | { type: 'MARK_ORPHANED'; cardId: string }
    | { type: 'SET_CARDS'; cards: BoardCard[] };

const STORAGE_KEY = 'violet-kanban-card-storage';

const CardContext = createContext<{
    state: State;
    addCard: (card: BoardCard) => void;
    updateCard: (card: Partial<BoardCard> & { id: string }) => void;
    removeCard: (cardId: string) => void;
    markCardOrphaned: (cardId: string) => void;
} | null>(null);

export function CardProvider({ children }: { children: ReactNode }) {
    let initial: State = { cards: [], orphanedCards: [] };
    try {
        if (typeof window !== 'undefined') {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) initial = JSON.parse(raw) as State;
        }
    } catch (e) {
        initial = { cards: [], orphanedCards: [] };
    }

    const [state, dispatch] = useReducer(cardReducer as any, initial);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            // ignore
        }
    }, [state]);

    const api = {
        state,
        addCard: (card: BoardCard) => dispatch({ type: 'ADD_CARD', card }),
        updateCard: (card: Partial<BoardCard> & { id: string }) =>
            dispatch({ type: 'UPDATE_CARD', card }),
        removeCard: (cardId: string) =>
            dispatch({ type: 'REMOVE_CARD', cardId }),
        markCardOrphaned: (cardId: string) =>
            dispatch({ type: 'MARK_ORPHANED', cardId }),
    };

    useEffect(() => {
        registerCardAdapter({
            addCard: api.addCard,
            updateCard: api.updateCard,
            removeCard: api.removeCard,
            markCardOrphaned: api.markCardOrphaned,
        });
        return () => registerCardAdapter(null);
    }, [state]);

    return <CardContext.Provider value={api}>{children}</CardContext.Provider>;
}

export function useCards() {
    const ctx = useContext(CardContext);
    if (!ctx) throw new Error('useCards must be used within CardProvider');
    return ctx;
}

// reducer lives in src/providers/reducers/cardReducer.ts
