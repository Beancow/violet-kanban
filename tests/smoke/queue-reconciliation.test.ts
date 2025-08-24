import { createReducerHarness } from '../helpers/reducerHarness';

describe('queue reconciliation smoke tests', () => {
    test('enqueue create-card then reconcile via handleCardActionSuccess', () => {
        const api = createReducerHarness();

        const tempId = 'temp-card-123';
        const createAction = {
            type: 'create-card',
            payload: { tempId, data: { title: 'Test card' } },
        } as any;

        // Enqueue create (card => enqueueCardAction)
        api.enqueueCardAction(createAction);
        expect(
            api.getQueue().filter((a) => a.type === 'create-card').length
        ).toBe(1);

        const createdCard = {
            id: 'real-card-1',
            title: 'Test card',
            listId: 'list-1',
            boardId: 'board-1',
            organizationId: 'org-1',
        };

        // Simulate server response: set mapping and add the full created card, then remove queued action
        api.setMapping(tempId, createdCard.id);
        api.addCard(createdCard as any);
        api.removeCardAction(tempId);

        // Queue should be cleared for card actions
        expect(
            api.getQueue().filter((a) => a.type === 'create-card').length
        ).toBe(0);

        // Card store should have the card
        expect(api.getCards()).toHaveLength(1);
        expect(api.getCards()[0]).toEqual(createdCard);

        // Temp map should still contain the mapping (consumer calls setMapping then removeAction)
        expect(api.getRealId(tempId)).toBe(createdCard.id);

        // no cleanup needed for reducer harness
    });

    test('enqueue create-list then reconcile via handleListActionSuccess', () => {
        const api = createReducerHarness();

        const tempId = 'temp-list-1';
        const createAction = {
            type: 'create-list',
            payload: { tempId, data: { title: 'L' } },
        } as any;
        api.enqueueListAction(createAction);
        expect(
            api.getQueue().filter((a) => a.type === 'create-list').length
        ).toBe(1);

        const createdList = {
            id: 'real-list-1',
            title: 'L',
            boardId: 'board-1',
            position: 0,
            organizationId: 'org-1',
        };
        api.setMapping(tempId, createdList.id);
        api.addList(createdList as any);
        api.removeListAction(tempId);

        expect(
            api.getQueue().filter((a) => a.type === 'create-list').length
        ).toBe(0);
        expect(api.getLists()).toHaveLength(1);
        expect(api.getLists()[0]).toEqual(createdList);
        expect(api.getRealId(tempId)).toBe(createdList.id);

        // no cleanup needed for reducer harness
    });

    test('enqueue create-board then reconcile via handleBoardActionSuccess', () => {
        const api = createReducerHarness();

        const tempId = 'temp-board-1';
        const createAction = {
            type: 'create-board',
            payload: { tempId, data: { title: 'B' } },
        } as any;
        api.enqueueBoardAction(createAction);
        expect(
            api.getQueue().filter((a) => a.type === 'create-board').length
        ).toBe(1);

        const createdBoard = {
            id: 'real-board-1',
            title: 'B',
            organizationId: 'org-1',
            lists: [],
            cards: [],
        };
        api.setMapping(tempId, createdBoard.id);
        api.addBoard(createdBoard as any);
        api.removeBoardAction(tempId);

        expect(
            api.getQueue().filter((a) => a.type === 'create-board').length
        ).toBe(0);
        expect(api.getBoards()).toHaveLength(1);
        expect(api.getBoards()[0]).toEqual(createdBoard);
        expect(api.getRealId(tempId)).toBe(createdBoard.id);

        // no cleanup needed for reducer harness
    });
});
