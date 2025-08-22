import { reducer as tempIdMapReducer } from '../../../src/providers/reducers/tempIdMapReducer';

describe('tempIdMapReducer', () => {
    it('sets and clears mappings', () => {
        const initial = {};
        const afterSet = tempIdMapReducer(initial, {
            type: 'SET_MAPPING',
            tempId: 't1',
            realId: 'r1',
        } as any);
        expect(afterSet['t1']).toBe('r1');
        const afterClear = tempIdMapReducer(afterSet, {
            type: 'CLEAR_MAPPING',
            tempId: 't1',
        } as any);
        expect(afterClear['t1']).toBeUndefined();
    });
});
