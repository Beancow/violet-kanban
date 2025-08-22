import { reducer } from '../../../src/providers/reducers/queueReducer';

type ActionLike = { type: string; payload?: any };

function makeAction(type: string, id?: string, tempId?: string): ActionLike {
    return {
        type,
        payload: { data: id ? { id } : tempId ? { tempId } : undefined },
    } as any;
}

describe('queueReducer', () => {
    const initial = { boardActionQueue: [], listActionQueue: [], cardActionQueue: [] } as any;

    it('enqueues and squashes board actions by id and type', () => {
        const a1 = makeAction('CREATE_BOARD', undefined, 't1');
        const enqueued1 = reducer(initial, { type: 'ENQUEUE_BOARD', action: a1 } as any);
        expect(enqueued1.boardActionQueue).toHaveLength(1);

        const a2 = makeAction('CREATE_BOARD', undefined, 't1');
        const enqueued2 = reducer(enqueued1, { type: 'ENQUEUE_BOARD', action: a2 } as any);
        expect(enqueued2.boardActionQueue).toHaveLength(1); // squashed
    });

    it('removes by id', () => {
        const a1 = makeAction('UPDATE_BOARD', 'r1');
        const state1 = reducer(initial, { type: 'ENQUEUE_BOARD', action: a1 } as any);
        expect(state1.boardActionQueue).toHaveLength(1);
        const afterRemove = reducer(state1, { type: 'REMOVE_BOARD_BY_ID', itemId: 'r1' } as any);
        expect(afterRemove.boardActionQueue).toHaveLength(0);
    });
});
import { reducer as queueReducer } from '../../../src/providers/reducers/queueReducer';

describe('queueReducer', () => {
    it('enqueues and squashes actions', () => {
        const initial = {
            boardActionQueue: [],
            listActionQueue: [],
            cardActionQueue: [],
        } as any;
        const action1 = {
            type: 'update-card',
            payload: { data: { id: 'c1' } },
            timestamp: 1,
        } as any;
        const action2 = {
            type: 'update-card',
            payload: { data: { id: 'c1' } },
            timestamp: 2,
        } as any;
        const after1 = queueReducer(initial, {
            type: 'ENQUEUE_CARD',
            action: action1,
        } as any);
        expect(after1.cardActionQueue.length).toBe(1);
        const after2 = queueReducer(after1, {
            type: 'ENQUEUE_CARD',
            action: action2,
        } as any);
        // second should have squashed the first
        expect(after2.cardActionQueue.length).toBe(1);
        expect(after2.cardActionQueue[0].timestamp).toBe(2);
    });
});
