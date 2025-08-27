import { isValidWorkerAction } from '@/providers/helpers';

describe('isValidWorkerAction', () => {
    test('returns true for a minimal valid action', () => {
        const a = { type: 'create-board' };
        expect(isValidWorkerAction(a)).toBe(true);
    });

    test('returns true for valid action with object payload', () => {
        const a = { type: 'update-card', payload: { data: { id: 'c1' } } };
        expect(isValidWorkerAction(a)).toBe(true);
    });

    test('returns false for non-object', () => {
        expect(isValidWorkerAction(null)).toBe(false);
        expect(isValidWorkerAction(42)).toBe(false);
    });

    test('returns false for missing type', () => {
        const a = { payload: {} } as any;
        expect(isValidWorkerAction(a)).toBe(false);
    });

    test('returns false for payload that is not object', () => {
        const a = { type: 'create-card', payload: 'not-an-object' } as any;
        expect(isValidWorkerAction(a)).toBe(false);
    });

    test('create-card requires data in payload', () => {
        expect(isValidWorkerAction({ type: 'create-card' })).toBe(false);
        expect(
            isValidWorkerAction({
                type: 'create-card',
                payload: { data: { title: 'x' } },
            })
        ).toBe(true);
    });
});
