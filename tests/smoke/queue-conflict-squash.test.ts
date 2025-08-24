import {
    squashQueueActions,
    isActionStale,
    isCardActionStale,
} from '../../src/providers/helpers';

describe('helpers: squash and stale detection', () => {
    test('squashQueueActions removes previous actions for same id+type', () => {
        const existing = [
            {
                type: 'update-card',
                payload: { data: { id: 'c1', title: 'A' } },
            },
        ] as any[];
        const newAction = {
            type: 'update-card',
            payload: { data: { id: 'c1', title: 'B' } },
        } as any;
        const res = squashQueueActions(existing, newAction as any);
        expect(res).toHaveLength(1);
        expect(res[0]).toBe(newAction);
    });

    test('isActionStale and isCardActionStale based on timestamps', () => {
        const now = Date.now();
        const action = { timestamp: now - 1000 } as any; // older than server
        const serverUpdatedAt = new Date(now).toISOString();
        expect(isActionStale(action, serverUpdatedAt)).toBe(true);

        // simulate a card in server store as a plain array (provider helpers accept arrays)
        const cards = [
            {
                id: 'c1',
                updatedAt: new Date(now).toISOString(),
            } as any,
        ];
        const cardAction = {
            type: 'update-card',
            payload: { data: { id: 'c1' } },
            timestamp: now - 5000,
        } as any;
        expect(isCardActionStale(cardAction, cards)).toBe(true);
    });
});
