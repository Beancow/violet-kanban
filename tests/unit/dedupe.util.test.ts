import { createDedupe } from '@/hooks/useWebWorker';

describe('createDedupe util', () => {
    test('dedupe returns true for quick duplicates and false after TTL', async () => {
        const d = createDedupe({ dedupeTtlMs: 20, dedupeMaxSeen: 100 });
        const payload = { tempId: 't1' };
        const t = 'ACTION_SUCCESS';
        // first call -> not duplicate
        expect(d.isDuplicateMessage(t, payload)).toBe(false);
        // immediate second -> duplicate
        expect(d.isDuplicateMessage(t, payload)).toBe(true);
        // wait past TTL
        await new Promise((r) => setTimeout(r, 30));
        // now should be treated as new
        expect(d.isDuplicateMessage(t, payload)).toBe(false);
    });

    test('dedupe enforces max size by evicting oldest', () => {
        const d = createDedupe({ dedupeTtlMs: 1000, dedupeMaxSeen: 3 });
        // add 4 distinct keys
        expect(d.isDuplicateMessage('A', { id: 1 })).toBe(false);
        expect(d.isDuplicateMessage('A', { id: 2 })).toBe(false);
        expect(d.isDuplicateMessage('A', { id: 3 })).toBe(false);
        // next insert should evict oldest
        expect(d.isDuplicateMessage('A', { id: 4 })).toBe(false);
        // first key (id:1) should no longer be present -> not duplicate
        expect(d.isDuplicateMessage('A', { id: 1 })).toBe(false);
    });
});
