import { reducer } from '../../../src/providers/reducers/tempIdMapReducer';

describe('tempIdMapReducer', () => {
    it('sets and clears a mapping', () => {
        const initial = {};
        const afterSet = reducer(initial, {
            type: 'SET_MAPPING',
            tempId: 't1',
            realId: 'r1',
        } as any);
        expect(afterSet['t1']).toBe('r1');

        const afterClear = reducer(afterSet, {
            type: 'CLEAR_MAPPING',
            tempId: 't1',
        } as any);
        expect(afterClear['t1']).toBeUndefined();
    });

    it('clears all mappings', () => {
        const initial = { a: '1', b: '2' };
        const after = reducer(initial, { type: 'CLEAR_ALL' } as any);
        expect(Object.keys(after)).toHaveLength(0);
    });
});
