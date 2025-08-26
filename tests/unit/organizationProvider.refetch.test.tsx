import React from 'react';
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils/renderWithProviders';

describe('OrganizationProvider.refetchOrganizations', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    test('successful fetch updates organizations', async () => {
        // mock fetch to return organizations
        (global as any).fetch = jest.fn(async () => ({
            ok: true,
            json: async () => ({
                success: true,
                organizations: [{ id: 'o1', name: 'Org 1' }],
            }),
        }));

        const authMock = {
            __esModule: true,
            default: ({ children }: any) => <>{children}</>,
            AuthProvider: ({ children }: any) => <>{children}</>,
            useAuth: () => ({
                hasAuth: true,
                authUser: { uid: 'u1' },
                loading: false,
                idToken: 'token',
            }),
        };

        const freshMock = {
            __esModule: true,
            default: () => async () => 'token',
        };

        // Mount provider tree to trigger auto-fetch
        renderWithProviders(() => React.createElement('div'), {
            moduleMocks: {
                '@/providers/AuthProvider': authMock,
                '@/hooks/useFreshToken': freshMock,
            },
        });

        // wait for fetch to be called
        await waitFor(() => expect((global as any).fetch).toHaveBeenCalled());

        // inspect provider adapter state
        const provider = require('@/providers/OrganizationProvider');
        const adapter = provider.getOrCreateOrganizationProvider();
        const state = adapter.getState();
        expect(state.organizations).toBeDefined();
        expect(state.organizations.length).toBeGreaterThan(0);
        expect(state.organizations[0].id).toBe('o1');
    });

    test('failed fetch sets refetchError', async () => {
        (global as any).fetch = jest.fn(async () => ({
            ok: false,
            json: async () => ({ error: 'not allowed' }),
            status: 403,
        }));

        const authMock = {
            __esModule: true,
            default: ({ children }: any) => <>{children}</>,
            AuthProvider: ({ children }: any) => <>{children}</>,
            useAuth: () => ({
                hasAuth: true,
                authUser: { uid: 'u1' },
                loading: false,
                idToken: 'token',
            }),
        };

        const freshMock = {
            __esModule: true,
            default: () => async () => 'token',
        };

        renderWithProviders(() => React.createElement('div'), {
            moduleMocks: {
                '@/providers/AuthProvider': authMock,
                '@/hooks/useFreshToken': freshMock,
            },
        });

        await waitFor(() => expect((global as any).fetch).toHaveBeenCalled());

        const provider = require('@/providers/OrganizationProvider');
        const adapter = provider.getOrCreateOrganizationProvider();
        const state = adapter.getState();
        expect(state.refetchError).toBeDefined();
    });
});
