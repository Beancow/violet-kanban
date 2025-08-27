/* @jest-environment jsdom */
// Top-level mocks to prevent importing real AuthProvider (which pulls in
// firebase/auth and expects a `fetch` polyfill in the test environment).
const {
    mockAuthProvider,
    mockOrganizationProvider,
} = require('../utils/providerMocks');
jest.mock('../../src/providers/AuthProvider', () =>
    mockAuthProvider({
        idToken: 'id',
        refreshIdToken: jest.fn().mockResolvedValue(undefined),
    })
);
jest.mock('../../src/providers/OrganizationProvider', () =>
    mockOrganizationProvider({ currentOrganizationId: 'org-1' })
);

import React from 'react';
import { act } from 'react';
import { renderWithProviders } from '../utils/renderWithProviders';
// Use manual webworker mock for deterministic behavior
jest.mock('@/hooks/useWebWorker', () => require('../__mocks__/useWebWorker'));

// Create a malformed QueueItem: missing `type` and payload is not an object
const badQueueItem = {
    id: 'bad-1',
    action: {
        // intentionally malformed: no `type` and payload is a string
        payload: 'this-should-be-an-object',
    },
};

describe('SyncManager malformed queue item removal', () => {
    test('removes malformed queue items from queues', async () => {
        const removeCardAction = jest.fn();
        const removeListAction = jest.fn();
        const removeBoardAction = jest.fn();

        // Minimal providers for Auth/Org used by renderWithProviders
        const {
            mockAuthProvider,
            mockOrganizationProvider,
        } = require('../utils/providerMocks');

        let tree: any;
        act(() => {
            tree = renderWithProviders(
                () => {
                    const SyncManager = require('../../src/components/SyncManager');
                    return React.createElement(
                        SyncManager.default ?? SyncManager
                    );
                },
                {
                    moduleMocks: {
                        // stub the QueueProvider to expose the malformed item and removal fns
                        '@/providers/QueueProvider': {
                            __esModule: true,
                            useQueues: () => ({
                                state: {
                                    boardActionQueue: [],
                                    listActionQueue: [],
                                    cardActionQueue: [badQueueItem],
                                },
                                enqueueCardAction: jest.fn(),
                                enqueueListAction: jest.fn(),
                                enqueueBoardAction: jest.fn(),
                                removeCardAction,
                                removeListAction,
                                removeBoardAction,
                            }),
                        },
                        '@/providers/SyncErrorProvider': {
                            __esModule: true,
                            useSyncErrorProvider: () => ({
                                errors: [],
                                addError: jest.fn(),
                                clearErrors: jest.fn(),
                            }),
                        },
                        '@/providers/UiProvider': {
                            __esModule: true,
                            useUi: () => ({ isOpen: (name?: string) => false }),
                        },
                    },
                }
            );
        });

        // allow the manager's scheduled work to run
        await act(async () => {
            await new Promise((r) => setTimeout(r, 0));
        });

        // The removeCardAction should have been called with the bad id
        expect(removeCardAction).toHaveBeenCalledWith('bad-1');

        act(() => tree.unmount());
    });
});
