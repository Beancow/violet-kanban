import { Draft, produce } from 'immer';
import type { BoardCard } from '../../types/appState.type';
import type { CardStateShape } from '@/types/state-shapes';

export type CardState = CardStateShape;

export type CardAction =
    | { type: 'ADD_CARD'; card: BoardCard }
    | { type: 'UPDATE_CARD'; card: Partial<BoardCard> & { id: string } }
    | { type: 'REMOVE_CARD'; cardId: string }
    | { type: 'MARK_ORPHANED'; cardId: string }
    | { type: 'SET_CARDS'; cards: BoardCard[] };
export function reducer(state: CardState, action: CardAction): CardState {
    return produce(state, (draft: Draft<CardState>) => {
        switch (action.type) {
            case 'ADD_CARD':
                draft.cards.push(action.card);
                return;
            case 'UPDATE_CARD': {
                const idx = draft.cards.findIndex(
                    (c) => c.id === action.card.id
                );
                if (idx >= 0) {
                    draft.cards[idx] = {
                        ...draft.cards[idx],
                        ...action.card,
                    } as BoardCard;
                }
                return;
            }
            case 'REMOVE_CARD':
                draft.cards = draft.cards.filter((c) => c.id !== action.cardId);
                return;
            case 'MARK_ORPHANED': {
                const card = draft.cards.find((c) => c.id === action.cardId);
                if (card) {
                    draft.orphanedCards = [
                        ...(draft.orphanedCards ?? []),
                        card,
                    ];
                }
                return;
            }
            case 'SET_CARDS':
                draft.cards = action.cards;
                return;
        }
    });
}

export default reducer;
