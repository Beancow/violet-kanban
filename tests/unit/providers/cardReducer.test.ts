import { reducer as cardReducer } from '../../../src/providers/reducers/cardReducer';

describe('cardReducer', () => {
    it('adds, updates, removes and marks orphaned cards', () => {
        const initial = { cards: [], orphanedCards: [] } as any;
        const card = { id: 'c1', title: 'Task' } as any;
        const afterAdd = cardReducer(initial, { type: 'ADD_CARD', card } as any);
        expect(afterAdd.cards.length).toBe(1);
        const afterUpdate = cardReducer(afterAdd, { type: 'UPDATE_CARD', card: { id: 'c1', title: 'Task 2' } } as any);
        expect((afterUpdate.cards[0] as any).title).toBe('Task 2');
        const afterMark = cardReducer(afterUpdate, { type: 'MARK_ORPHANED', cardId: 'c1' } as any);
        expect(afterMark.orphanedCards && afterMark.orphanedCards.length).toBe(1);
        const afterRemove = cardReducer(afterMark, { type: 'REMOVE_CARD', cardId: 'c1' } as any);
        expect(afterRemove.cards.length).toBe(0);
    });
});
