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
