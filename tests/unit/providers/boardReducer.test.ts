import { reducer as boardReducer } from '../../../src/providers/reducers/boardReducer';

describe('boardReducer', () => {
    it('adds, updates and removes boards', () => {
        const initial = { boards: [] };
        const b = { id: 'b1', name: 'Board 1' } as any;
        const afterAdd = boardReducer(initial, {
            type: 'ADD_BOARD',
            board: b,
        } as any);
        expect(afterAdd.boards.length).toBe(1);
        const afterUpdate = boardReducer(afterAdd, {
            type: 'UPDATE_BOARD',
            board: { id: 'b1', name: 'New' },
        } as any);
        expect((afterUpdate.boards[0] as any).name).toBe('New');
        const afterRemove = boardReducer(afterUpdate, {
            type: 'REMOVE_BOARD',
            boardId: 'b1',
        } as any);
        expect(afterRemove.boards.length).toBe(0);
    });
});
