import { renderHook, act } from '@testing-library/react';
import useFreshToken from '@/hooks/useFreshToken';

// We'll mock the auth provider hook to control lastAuthAt, idToken and refreshIdToken
jest.mock('@/providers/AuthProvider', () => ({
    useAuth: jest.fn(),
}));

const { useAuth } = require('@/providers/AuthProvider');

describe('useFreshToken', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('returns existing token when lastAuthAt is recent and does not call refresh', async () => {
        const fakeAuth = {
            idToken: 'existing-token',
            lastAuthAt: Date.now(),
            refreshIdToken: jest.fn().mockResolvedValue('new-token'),
        };
        useAuth.mockReturnValue(fakeAuth);

        const { result } = renderHook(() => useFreshToken());
        let token: string | null = null;
        await act(async () => {
            token = await result.current();
        });

        expect(token).toBe('existing-token');
        expect(fakeAuth.refreshIdToken).not.toHaveBeenCalled();
    });

    it('calls refreshIdToken when lastAuthAt is stale and returns refreshed token', async () => {
        const staleTime = Date.now() - 1000 * 60 * 60; // 1 hour ago
        const fakeAuth: any = {
            idToken: null,
            lastAuthAt: staleTime,
            refreshIdToken: jest.fn().mockResolvedValue('refreshed-token'),
        };
        // After refresh, idToken should be set on auth. Simulate by updating mock implementation.
        useAuth.mockReturnValue(fakeAuth);

        // Make refreshIdToken also set idToken on the fake auth object to emulate provider
        fakeAuth.refreshIdToken.mockImplementation(async () => {
            fakeAuth.idToken = 'refreshed-token';
            return 'refreshed-token';
        });

        const { result } = renderHook(() => useFreshToken());
        let token: string | null = null;
        await act(async () => {
            token = await result.current();
        });

        expect(fakeAuth.refreshIdToken).toHaveBeenCalled();
        expect(token).toBe('refreshed-token');
    });

    it('returns null when no refresh function is available', async () => {
        const fakeAuth: any = {
            idToken: null,
            lastAuthAt: null,
            refreshIdToken: undefined,
        };
        useAuth.mockReturnValue(fakeAuth);

        const { result } = renderHook(() => useFreshToken());
        let token: string | null = 'init';
        await act(async () => {
            token = await result.current();
        });

        expect(token).toBeNull();
    });

    it('returns null when refreshIdToken resolves null (cooldown)', async () => {
        const staleTime = Date.now() - 1000 * 60 * 60; // 1 hour ago
        const fakeAuth: any = {
            idToken: null,
            lastAuthAt: staleTime,
            refreshIdToken: jest.fn().mockResolvedValue(null),
        };
        useAuth.mockReturnValue(fakeAuth);

        const { result } = renderHook(() => useFreshToken());
        let token: string | null = 'init';
        await act(async () => {
            token = await result.current();
        });

        expect(fakeAuth.refreshIdToken).toHaveBeenCalled();
        expect(token).toBeNull();
    });

    it('returns null when refreshIdToken throws an error', async () => {
        const staleTime = Date.now() - 1000 * 60 * 60; // 1 hour ago
        const fakeAuth: any = {
            idToken: null,
            lastAuthAt: staleTime,
            refreshIdToken: jest.fn().mockRejectedValue(new Error('boom')),
        };
        useAuth.mockReturnValue(fakeAuth);

        const { result } = renderHook(() => useFreshToken());
        let token: string | null = 'init';
        await act(async () => {
            token = await result.current();
        });

        expect(fakeAuth.refreshIdToken).toHaveBeenCalled();
        expect(token).toBeNull();
    });

    it('refreshes when idToken exists but lastAuthAt is null', async () => {
        const fakeAuth: any = {
            idToken: 'initial-token',
            lastAuthAt: null,
            refreshIdToken: jest.fn().mockResolvedValue('after-refresh'),
        };
        // simulate refresh setting idToken
        fakeAuth.refreshIdToken.mockImplementation(async () => {
            fakeAuth.idToken = 'after-refresh';
            return 'after-refresh';
        });
        useAuth.mockReturnValue(fakeAuth);

        const { result } = renderHook(() => useFreshToken());
        let token: string | null = null;
        await act(async () => {
            token = await result.current();
        });

        expect(fakeAuth.refreshIdToken).toHaveBeenCalled();
        expect(token).toBe('after-refresh');
    });
});
