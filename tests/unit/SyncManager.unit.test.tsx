import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { installFakeWorker, uninstallFakeWorker } from '../helpers/fakeWorker';

// createAction used in mocked queue
const createAction = {
    type: 'create-card',
    payload: {
        tempId: 't123',
        data: { title: 'T' },
        listId: 'l1',
        boardId: 'b1',
    },
    timestamp: Date.now(),
} as any;

// Mock QueueProvider hook to return a stable queue containing the createAction
jest.mock('../../src/providers/QueueProvider', () => ({
    useQueues: () => ({
        state: {
            boardActionQueue: [],
            listActionQueue: [],
            cardActionQueue: [createAction],
        },
    }),
}));

// Mock auth provider
jest.mock('../../src/providers/AuthProvider', () => ({
    useAuthProvider: () => ({
        idToken: 'idtok',
        refreshIdToken: jest.fn().mockResolvedValue(undefined),
    }),
}));

// Mock organization provider
jest.mock('../../src/providers/OrganizationProvider', () => ({
    useOrganizationProvider: () => ({ currentOrganizationId: 'org-1' }),
}));

// Mock SyncErrorProvider
jest.mock('../../src/providers/SyncErrorProvider', () => ({
    useSyncErrorProvider: () => ({
        errors: [],
        addError: jest.fn(),
        clearErrors: jest.fn(),
    }),
}));

// Provide a mock adapter that we can inspect
const adapterMock = {
    enqueueCardAction: jest.fn(),
    enqueueListAction: jest.fn(),
    enqueueBoardAction: jest.fn(),
};

jest.mock('@/providers/adapter', () => ({
    getQueueAdapter: () => adapterMock,
}));

// Import under test after mocks
import { SyncManager } from '../../src/components/SyncManager';

describe('SyncManager (unit)', () => {
    beforeEach(() => {
        adapterMock.enqueueCardAction.mockClear();
        const mockFetch = jest.fn(async (url: string) => {
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
        installFakeWorker({ fetchImpl: mockFetch as any });

        // provide minimal window shims for Node test env
        (global as any).window = (global as any).window || {};
        (global as any).window.addEventListener =
            (global as any).window.addEventListener || jest.fn();
        (global as any).window.removeEventListener =
            (global as any).window.removeEventListener || jest.fn();
        (global as any).window.setInterval =
            (global as any).window.setInterval || setInterval.bind(global);
        (global as any).window.clearInterval =
            (global as any).window.clearInterval || clearInterval.bind(global);
    });
    afterEach(() => {
        uninstallFakeWorker();
    });

    test('worker ACTION_SUCCESS causes enqueue RECONCILE_CARD via adapter', async () => {
        let tree: any;
        act(() => {
            tree = renderer.create(<SyncManager />);
        });

        // retrieve the last fake worker instance and simulate ACTION_SUCCESS
        const w = (global as any).__lastFakeWorker as any;
        expect(w).toBeDefined();

        // simulate worker success callback
        act(() => {
            if (w && w.onmessage) {
                w.onmessage({
                    data: {
                        type: 'ACTION_SUCCESS',
                        payload: {
                            tempId: 't123',
                            card: { id: 'real-card-1' },
                        },
                    },
                });
            }
        });

        // The SyncManager should have enqueued a reconcile via the adapter
        expect(adapterMock.enqueueCardAction).toHaveBeenCalled();
        const calledWith = adapterMock.enqueueCardAction.mock.calls[0][0];
        expect(calledWith.type).toMatch(/RECONCILE_CARD|RECONCILE/i);

        act(() => {
            tree.unmount();
        });
    });
});
