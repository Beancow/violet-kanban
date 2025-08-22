import { reducer as listReducer } from '../../../src/providers/reducers/listReducer';

describe('listReducer', () => {
    it('adds, updates, and removes a list', () => {
        const initial = { lists: [] } as any;
        const list = { id: 'l1', name: 'Todo' } as any;
        const afterAdd = listReducer(initial, { type: 'ADD_LIST', list } as any);
        expect(afterAdd.lists.length).toBe(1);
        const afterUpdate = listReducer(afterAdd, { type: 'UPDATE_LIST', list: { id: 'l1', name: 'Done' } } as any);
        expect((afterUpdate.lists[0] as any).name).toBe('Done');
        const afterRemove = listReducer(afterUpdate, { type: 'REMOVE_LIST', listId: 'l1' } as any);
        expect(afterRemove.lists.length).toBe(0);
    });
});
