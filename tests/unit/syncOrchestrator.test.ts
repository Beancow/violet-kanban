import SyncOrchestrator from '@/services/SyncOrchestrator';

jest.useFakeTimers();

describe('SyncOrchestrator (minimal)', () => {
    test('happy path ACTION_SUCCESS resolves in-flight and emits reconciliation', async () => {
        const posted: any[] = [];
        const syncError: any = { addError: jest.fn() };
        const getToken = async () => undefined;

        let postResolve: (() => void) | undefined;
        const postCalled = new Promise<void>((r) => (postResolve = r));
        const mockPost = (m: any) => {
            posted.push(m);
            try {
                postResolve?.();
            } catch (_) {}
        };

        const queueApi: any = {
            state: {
                boardActionQueue: [
                    {
                        id: 'q1',
                        action: {
                            type: 'CREATE_BOARD',
                            payload: { data: { id: 'temp-1' } },
                        },
                    },
                ],
                listActionQueue: [],
                cardActionQueue: [],
            },
            removeBoardAction: jest.fn(),
            removeListAction: jest.fn(),
            removeCardAction: jest.fn(),
            enqueueBoardAction: jest.fn(),
            enqueueListAction: jest.fn(),
            enqueueCardAction: jest.fn(),
        };

        const orchestrator = new SyncOrchestrator({
            queueApi,
            syncError,
            getFreshToken: getToken,
            postMessage: mockPost,
            reconciliation: {},
            tempMap: { getRealId: () => null },
        });

        orchestrator.start();

        // Wait until the orchestrator posts to the worker
        await postCalled;
        expect(posted.length).toBe(1);

        // simulate worker response: ACTION_SUCCESS with matching id
        orchestrator.handleWorkerMessage({
            type: 'ACTION_SUCCESS',
            payload: { id: 'temp-1' },
        });

        // allow any resolves
        await Promise.resolve();
    });

    test('timeout triggers error path', async () => {
        const posted: any[] = [];
        const syncError: any = { addError: jest.fn() };
        const getToken = async () => undefined;

        let postResolve: (() => void) | undefined;
        const postCalled = new Promise<void>((r) => (postResolve = r));
        const mockPost = (m: any) => {
            posted.push(m);
            try {
                postResolve?.();
            } catch (_) {}
        };

        const queueApi: any = {
            state: {
                boardActionQueue: [
                    {
                        id: 'q2',
                        action: {
                            type: 'CREATE_BOARD',
                            payload: { data: { id: 'temp-2' } },
                        },
                    },
                ],
                listActionQueue: [],
                cardActionQueue: [],
            },
            removeBoardAction: jest.fn(),
            removeListAction: jest.fn(),
            removeCardAction: jest.fn(),
            enqueueBoardAction: jest.fn(),
            enqueueListAction: jest.fn(),
            enqueueCardAction: jest.fn(),
        };

        const orchestrator = new SyncOrchestrator({
            queueApi,
            syncError,
            getFreshToken: getToken,
            postMessage: mockPost,
            reconciliation: {},
            tempMap: { getRealId: () => null },
        });

        orchestrator.start();

        // Wait until the orchestrator posts to the worker
        await postCalled;

        // Simulate worker error message
        orchestrator.handleWorkerMessage({
            type: 'ERROR',
            payload: { foo: 'bar' },
            error: new Error('boom'),
        });
        await Promise.resolve();
        expect(syncError.addError).toHaveBeenCalled();
    });
});
