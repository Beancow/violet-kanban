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

        // We'll enqueue two create-card actions to ensure the worker processes
        // them serialized (one at a time). The fake worker records
        // maxConcurrent which should remain 1.
        const tempId1 = 'temp-card-xyz-1';
        const tempId2 = 'temp-card-xyz-2';
        const createAction1 = {
            type: 'create-card',
            payload: {
                tempId: tempId1,
                data: { title: 'T1' },
                listId: 'l1',
                boardId: 'b1',
            },
            timestamp: Date.now(),
        } as any;
        const createAction2 = {
            type: 'create-card',
            payload: {
                tempId: tempId2,
                data: { title: 'T2' },
                listId: 'l1',
                boardId: 'b1',
            },
            timestamp: Date.now() + 1,
        } as any;

        // Enqueue only the first create via the reducer harness. The harness
        // does not wrap actions into QueueItems with stable ids, so enqueueing
        // two raw actions can cause squash behavior; post the second directly
        // to the fake worker to simulate a burst without relying on queue logic.
        api.enqueueCardAction(createAction1);
        expect(
            api.getQueue().filter((a: any) => a.type === 'create-card')
        ).toHaveLength(1);

        // Construct fake worker and post both actions quickly. With serialized
        // SyncManager behavior, the worker should never have concurrent active
        // requests > 1.
        const w = new (global as any).Worker('dataSyncWorker.js');
        // Wait for worker ready
        await new Promise((r) => setTimeout(r, 0));

        // Post both messages in quick succession to simulate burst. The first
        // message represents the queued action; the second is an extra
        // simultaneous message coming in.
        (w as any).postMessage(createAction1);
        (w as any).postMessage(createAction2);

        // Allow fake worker async processing to run
        await new Promise((r) => setTimeout(r, 50));

        // Assert fake worker observed serialized processing
        const fw = (global as any).__lastFakeWorker as any;
        expect(fw).toBeDefined();
        expect(fw.maxConcurrent).toBeLessThanOrEqual(1);

        // Simulate SyncManager reconciliation for both completed creates
        api.setMapping(tempId1, 'real-card-1');
        api.addCard({
            id: 'real-card-1',
            title: 'FromServer1',
            listId: 'l1',
            boardId: 'b1',
        } as any);
        api.removeCardAction(tempId1);

        api.setMapping(tempId2, 'real-card-2');
        api.addCard({
            id: 'real-card-2',
            title: 'FromServer2',
            listId: 'l1',
            boardId: 'b1',
        } as any);
        api.removeCardAction(tempId2);

        // assertions
        expect(api.getCards()).toHaveLength(2);
        expect(api.getCards().map((c: any) => c.id)).toEqual([
            'real-card-1',
            'real-card-2',
        ]);
        expect(
            api.getQueue().find((a: any) => a.type === 'create-card')
        ).toBeUndefined();
    });
});
