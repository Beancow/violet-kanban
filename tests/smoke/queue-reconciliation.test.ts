import { createTestStores } from '../helpers/createTestStores';

describe('queue reconciliation smoke tests', () => {
    test('enqueue create-card then reconcile via handleCardActionSuccess', () => {
        const { cardStore, tempMap, queue } = createTestStores();

        const tempId = 'temp-card-123';
        const createAction = {
            type: 'create-card',
            payload: { tempId, data: { title: 'Test card' } },
        } as any;

        // Enqueue create
        queue.getState().enqueueCardAction(createAction);
        expect(queue.getState().cardActionQueue.length).toBe(1);

        const createdCard = { id: 'real-card-1', title: 'Test card' };

        // Call handler
        queue.getState().handleCardActionSuccess(tempId, createdCard);

        // Queue should be cleared
        expect(queue.getState().cardActionQueue.length).toBe(0);

        // Card store should have the card
        expect(cardStore.getState().cards).toHaveLength(1);
        expect(cardStore.getState().cards[0]).toEqual(createdCard);

        // Temp map should be cleared
        expect(tempMap.getState().getRealId(tempId)).toBeUndefined();
    });

    test('enqueue create-list then reconcile via handleListActionSuccess', () => {
        const { listStore, tempMap, queue } = createTestStores();

        const tempId = 'temp-list-1';
        const createAction = {
            type: 'create-list',
            payload: { tempId, data: { title: 'L' } },
        } as any;
        queue.getState().enqueueListAction(createAction);
        expect(queue.getState().listActionQueue.length).toBe(1);

        const createdList = { id: 'real-list-1', title: 'L' };
        queue.getState().handleListActionSuccess(tempId, createdList);

        expect(queue.getState().listActionQueue.length).toBe(0);
        expect(listStore.getState().lists).toHaveLength(1);
        expect(listStore.getState().lists[0]).toEqual(createdList);
        expect(tempMap.getState().getRealId(tempId)).toBeUndefined();
    });

    test('enqueue create-board then reconcile via handleBoardActionSuccess', () => {
        const { boardStore, tempMap, queue } = createTestStores();

        const tempId = 'temp-board-1';
        const createAction = {
            type: 'create-board',
            payload: { tempId, data: { title: 'B' } },
        } as any;
        queue.getState().enqueueBoardAction(createAction);
        expect(queue.getState().boardActionQueue.length).toBe(1);

        const createdBoard = { id: 'real-board-1', title: 'B' };
        queue.getState().handleBoardActionSuccess(tempId, createdBoard);

        expect(queue.getState().boardActionQueue.length).toBe(0);
        expect(boardStore.getState().boards).toHaveLength(1);
        expect(boardStore.getState().boards[0]).toEqual(createdBoard);
        expect(tempMap.getState().getRealId(tempId)).toBeUndefined();
    });
});
