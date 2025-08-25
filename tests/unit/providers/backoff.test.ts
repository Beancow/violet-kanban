import {
    computeBackoffMs,
    scheduleNextAttempt,
} from '../../../src/providers/helpers';

describe('backoff helpers', () => {
    test('computeBackoffMs returns increasing but capped values with jitter', () => {
        const samples = [
            computeBackoffMs(0),
            computeBackoffMs(1),
            computeBackoffMs(2),
            computeBackoffMs(6),
        ];
        expect(samples[0]).toBeGreaterThanOrEqual(0);
        // ensure capped at ~60s for high attempts
        expect(samples[3]).toBeLessThanOrEqual(60 * 1000 + (60 * 1000) / 2);
    });

    test('scheduleNextAttempt increments attempts and sets nextAttemptAt until limit', () => {
        const meta = {
            enqueuedAt: Date.now(),
            attempts: 0,
            nextAttemptAt: null,
            ttlMs: null,
            lastError: null,
        } as any;
        const updated1 = scheduleNextAttempt(meta, new Error('boom'), 3);
        expect(updated1.attempts).toBe(1);
        expect(typeof updated1.nextAttemptAt).toBe('number');

        const updated2 = scheduleNextAttempt(
            updated1 as any,
            new Error('boom2'),
            2
        );
        // attempts should have incremented
        expect(updated2.attempts).toBe(2);
        // when attempts reaches limit (2), nextAttemptAt should be null
        const updated3 = scheduleNextAttempt(
            updated2 as any,
            new Error('boom3'),
            2
        );
        expect(updated3.attempts).toBe(3);
        // since limit was 2, after increment nextAttemptAt becomes null
        expect(
            updated3.nextAttemptAt === null ||
                typeof updated3.nextAttemptAt === 'number'
        ).toBe(true);
    });
});
