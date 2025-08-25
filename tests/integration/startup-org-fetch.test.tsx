// Ensure a fetch polyfill is present before importing firebase/auth or providers
// which may require global.fetch at module-eval time.
// @ts-ignore
if (typeof global.fetch === 'undefined') global.fetch = jest.fn();

import React, { lazy } from 'react';
import { waitFor } from '@testing-library/react';
import {
    renderWithProviders,
    createSeededOrganizationProvider,
} from '../utils/renderWithProviders';

describe('startup organization fetch', () => {
    beforeEach(() => {
        // Reset global fetch mock
        // @ts-ignore
        global.fetch = jest.fn();
    });

    afterEach(() => {
        // @ts-ignore
        global.fetch.mockRestore && global.fetch.mockRestore();
        jest.resetAllMocks();
    });

    it('enqueues fetch-organizations on startup and processes it, setting organizations', async () => {
        // mock fetch to return success
        // @ts-ignore
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                organizations: [{ id: 'o1', name: 'Org 1' }],
            }),
        });

        // Build provider module mocks and pass them to renderWithProviders so
        // they are applied before the test requires any provider modules.
        const pm = require('../utils/providerMocks');
        const authMock = pm.mockAuthProviderWithToken({
            idToken: 'token',
            refreshIdToken: async () => 'token',
            authUser: { uid: 'u1' },
        });
        const orgApi = {
            setOrganizations: jest.fn(),
            organizations: [],
            loading: false,
            currentOrganizationId: null,
            currentOrganization: null,
            setCurrentOrganizationId: () => {},
            setLoading: () => {},
            refetchOrganizations: async () => {},
        };
        const orgMock = pm.mockOrganizationProvider(orgApi);

        const queueMock = {
            __esModule: true,
            useQueues: () => ({
                state: {
                    boardActionQueue: [],
                    listActionQueue: [],
                    cardActionQueue: [],
                    orgActionQueue: [
                        {
                            id: 'fetch-organizations:u1',
                            action: {
                                type: 'fetch-organizations',
                                payload: {
                                    userId: 'u1',
                                    timestamp: Date.now(),
                                },
                            },
                            meta: {
                                enqueuedAt: Date.now(),
                                attempts: 0,
                                nextAttemptAt: null,
                                ttlMs: null,
                                lastError: null,
                            },
                        },
                    ],
                },
                enqueueOrgAction: jest.fn(),
                removeOrgAction: jest.fn(),
            }),
        };

        const syncErrorMock = {
            __esModule: true,
            useSyncErrorProvider: () => ({
                errors: [],
                addError: jest.fn(),
                clearErrors: jest.fn(),
            }),
        };

        // Render SyncManager after renderWithProviders has applied module mocks.
        renderWithProviders(
            () => {
                const SyncManager = require('@/components/SyncManager');
                return React.createElement(SyncManager.default);
            },
            {
                moduleMocks: {
                    '@/providers/AuthProvider': authMock,
                    '@/providers/OrganizationProvider': orgMock,
                    '@/providers/QueueProvider': queueMock,
                    '@/providers/SyncErrorProvider': syncErrorMock,
                },
            }
        );

        // Wait for fetch and processing to complete and assert org set called
        await waitFor(() => expect(orgApi.setOrganizations).toHaveBeenCalled());
    });
});
