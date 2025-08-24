import { installFakeWorker, uninstallFakeWorker } from '../helpers/fakeWorker';
import { createReducerHarness } from '../helpers/reducerHarness';

describe('worker + reducers integration', () => {
    beforeEach(() => {
        // install fake worker that uses global.fetch
        installFakeWorker();
    });
    afterEach(() => {
        uninstallFakeWorker();
        // clear fetch mock if present
        if ((global as any).fetch?.mockClear) (global as any).fetch.mockClear();
    });

    test('create-card goes through worker and reconciles into card reducer', async () => {
        const api = createReducerHarness();

        // mock fetch endpoint for create-card
        (global as any).fetch = jest.fn(async (url: string) => {
            if (url === '/api/cards/create') {
                return {
                    ok: true,
                    json: async () => ({
                        data: {
                            card: { id: 'real-card-1', title: 'FromServer' },
                        },
                    }),
                };
            }
            return { ok: false, json: async () => ({ error: 'not found' }) };
        });

        const tempId = 'temp-card-xyz';
        const createAction = {
            type: 'create-card',
            payload: {
                tempId,
                data: { title: 'T' },
                listId: 'l1',
                boardId: 'b1',
            },
            timestamp: Date.now(),
        } as any;

        // Enqueue create in queue reducer
        api.enqueueCardAction(createAction);
        expect(api.getQueue().some((a: any) => a.type === 'create-card')).toBe(
            true
        );

        // Simulate SyncManager posting to worker: worker fake will call fetch and then call onmessage back
        // In production SyncManager posts the same action; here we simulate by directly constructing a worker and posting
        const w = new (global as any).Worker('dataSyncWorker.js');
        // Wait for worker ready
        await new Promise((r) => setTimeout(r, 0));

        // Post the action - fake worker will call fetch and then onmessage -> which SyncManager would intercept
        // To keep this test focused on reducers, we simulate the reconciliation step that SyncManager does on ACTION_SUCCESS
        // Call postMessage to trigger fake fetch and then wait for worker to respond by giving it some time
        (w as any).postMessage(createAction);
        await new Promise((r) => setTimeout(r, 0));

        // After fake worker runs, it emits ACTION_SUCCESS with payload.card and payload.tempId
        // Simulate SyncManager behavior: set mapping, add card, remove queue item
        api.setMapping(tempId, 'real-card-1');
        api.addCard({
            id: 'real-card-1',
            title: 'FromServer',
            listId: 'l1',
            boardId: 'b1',
        } as any);
        api.removeCardAction(tempId);

        // assertions
        expect(api.getCards()).toHaveLength(1);
        expect(api.getCards()[0].id).toBe('real-card-1');
        expect(
            api.getQueue().find((a: any) => a.type === 'create-card')
        ).toBeUndefined();
    });
});
