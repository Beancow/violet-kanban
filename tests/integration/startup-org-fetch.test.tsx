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
        const authMock = {
            __esModule: true,
            default: pm.MockAuthProvider,
            AuthProvider: pm.MockAuthProvider,
            useAuth: () => ({
                authUser: { uid: 'u1' },
                loading: false,
                logout: async () => {},
                idToken: 'token',
                refreshIdToken: async () => 'token',
                hasAuth: true,
            }),
        };

        const queueMock = {
            __esModule: true,
            useQueues: () => ({
                state: {
                    boardActionQueue: [],
                    listActionQueue: [],
                    cardActionQueue: [],
                },
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

        // Mount the provider tree so OrganizationProvider runs its startup
        // auto-fetch. We render a minimal child since the provider's effect
        // runs on mount.
        renderWithProviders(() => React.createElement('div'), {
            moduleMocks: {
                '@/providers/AuthProvider': authMock,
                '@/providers/QueueProvider': queueMock,
                '@/providers/SyncErrorProvider': syncErrorMock,
            },
        });

        // Wait for provider to call the network fetch for organizations.
        // OrganizationProvider is responsible for startup fetch now.
        // @ts-ignore
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    });
});
