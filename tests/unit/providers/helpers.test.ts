import { computeQueueItemId } from '../../../src/providers/helpers';

describe('computeQueueItemId', () => {
    it('uses payload.data.id when present', () => {
        const action: any = {
            type: 'update-card',
            payload: { data: { id: 'c123' } },
        };
        const id = computeQueueItemId(action);
        expect(id).toContain('update-card:c123');
    });

    it('falls back to payload.userId when present', () => {
        const action: any = {
            type: 'fetch-organizations',
            payload: { userId: 'u1' },
        };
        const id = computeQueueItemId(action);
        expect(id).toContain('fetch-organizations:u1');
    });

    it('falls back to hashed payload when no id present', () => {
        const action: any = { type: 'do-thing', payload: { foo: 'bar' } };
        const id = computeQueueItemId(action);
        expect(id.startsWith('do-thing:')).toBe(true);
    });
});
