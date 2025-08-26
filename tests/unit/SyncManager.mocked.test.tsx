/* @jest-environment jsdom */
import React from 'react';
import { act } from 'react';
import { renderWithProviders } from '../utils/renderWithProviders';
import {
    mockAuthProvider,
    mockOrganizationProvider,
} from '../utils/providerMocks';

// Ensure Jest uses the manual mock implementation from tests/__mocks__
jest.mock('@/hooks/useWebWorker', () => require('../__mocks__/useWebWorker'));

jest.mock('../../src/providers/AuthProvider', () =>
    mockAuthProvider({
        idToken: 'idtok',
        refreshIdToken: jest.fn().mockResolvedValue(undefined),
    })
);

jest.mock('../../src/providers/OrganizationProvider', () =>
    mockOrganizationProvider({ currentOrganizationId: 'org-1' })
);

jest.mock('../../src/providers/SyncErrorProvider', () => ({
    useSyncErrorProvider: () => ({
        errors: [],
        addError: jest.fn(),
        clearErrors: jest.fn(),
    }),
}));

const {
    __setLastMessage,
    __postMessageMock,
    __resetMock,
} = require('../__mocks__/useWebWorker');

describe('SyncManager with mocked useWebWorker', () => {
    beforeEach(() => {
        __resetMock();
        __postMessageMock.mockClear();
    });

    test('ACTION_SUCCESS from mocked hook enqueues reconcile', async () => {
        const enqueueCardActionMock = jest.fn();

        let tree: any;
        act(() => {
            tree = renderWithProviders(
                () => {
                    const SyncManager = require('@/components/SyncManager');
                    return React.createElement(
                        SyncManager.default ?? SyncManager
                    );
                },
                {
                    moduleMocks: {
                        '@/providers/QueueProvider': {
                            __esModule: true,
                            useQueues: () => ({
                                state: {
                                    boardActionQueue: [],
                                    listActionQueue: [],
                                    cardActionQueue: [],
                                },
                                enqueueCardAction: enqueueCardActionMock,
                                enqueueListAction: jest.fn(),
                                enqueueBoardAction: jest.fn(),
                            }),
                        },
                    },
                }
            );
        });

        // simulate worker success message
        act(() => {
            __setLastMessage({
                type: 'ACTION_SUCCESS',
                payload: { tempId: 't123', card: { id: 'real-card-1' } },
            });
        });

        expect(enqueueCardActionMock).toHaveBeenCalled();

        act(() => {
            tree.unmount();
        });
    });
});
