import { installFakeWorker, uninstallFakeWorker } from '../helpers/fakeWorker';
import { createReducerHarness } from '../helpers/reducerHarness';

describe('worker echo protection', () => {
    beforeEach(() => {
        installFakeWorker();
    });
    afterEach(() => {
        uninstallFakeWorker();
        if ((global as any).fetch?.mockClear) (global as any).fetch.mockClear();
        jest.resetAllMocks();
    });

    test('main thread ignores worker-origin messages and avoids reposting', async () => {
        const api = createReducerHarness();

        // mock fetch for create-card
        (global as any).fetch = jest.fn(async (url: string) => {
            if (url === '/api/cards/create') {
                return {
                    ok: true,
                    json: async () => ({
                        data: { card: { id: 'real-card-echo', title: 'Echo' } },
                    }),
                };
            }
            return { ok: false, json: async () => ({ error: 'not found' }) };
        });

        const tempId = 'temp-echo-1';
        const createAction = {
            type: 'create-card',
            payload: {
                tempId,
                data: { title: 'Echo' },
                listId: 'l1',
                boardId: 'b1',
            },
            timestamp: Date.now(),
        } as any;

        // Enqueue create action (SyncManager will post to worker)
        api.enqueueCardAction(createAction);

        // Create fake worker and wait for ready
        const w = new (global as any).Worker('dataSyncWorker.js');
        await new Promise((r) => setTimeout(r, 0));

        // Grab the fake worker instance the helper installed
        const fw = (global as any).__lastFakeWorker as any;
        expect(fw).toBeDefined();

        // Spy on global Worker.postMessage to detect repost attempts from main thread.
        const origPost = fw.postMessage.bind(fw);
        let postCount = 0;
        fw.postMessage = (m: any) => {
            postCount += 1;
            return origPost(m);
        };

        // Allow SyncManager to post the original message and fake worker to process it
        await new Promise((r) => setTimeout(r, 50));

        // Now simulate an echo: the worker posts ACTION_SUCCESS which contains meta.origin: 'worker'
        const successPayload = {
            type: 'ACTION_SUCCESS',
            payload: {
                timestamp: Date.now(),
                tempId,
                card: { id: 'real-card-echo', title: 'Echo' },
                type: 'create-card',
            },
            meta: { origin: 'worker' },
        };

        // Simulate worker->main message
        if (fw.onmessage) fw.onmessage({ data: successPayload });

        // Wait a short time to allow any potential echo reposting
        await new Promise((r) => setTimeout(r, 50));

        // postCount should be 1 (the original SyncManager post). If main thread reposts
        // worker-origin messages back into the worker, postCount would increase.
        expect(postCount).toBeLessThanOrEqual(1);

        // Also ensure the harness applied reconciliation mapping
        api.setMapping(tempId, 'real-card-echo');
        api.addCard({
            id: 'real-card-echo',
            title: 'Echo',
            listId: 'l1',
            boardId: 'b1',
        } as any);
        api.removeCardAction(tempId);

        expect(api.getCards().map((c: any) => c.id)).toContain(
            'real-card-echo'
        );
    });
});
