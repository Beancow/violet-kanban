'use client';
import { useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { safeCaptureException } from '@/lib/sentryWrapper';

// Keep the same threshold used elsewhere: refresh proactively after 50 minutes
const TOKEN_REFRESH_THRESHOLD_MS = 50 * 60 * 1000; // 50 minutes

export default function useFreshToken() {
    const auth = useAuth();

    return useCallback(async (): Promise<string | null> => {
        let token = auth.idToken ?? null;

        // If we have a refresh function available, only call it when the
        // last successful auth is older than the threshold. refreshIdToken
        // itself contains backoff/cooldown logic so callers can safely call it.
        if (auth.refreshIdToken) {
            const last = (auth as any).lastAuthAt as number | null | undefined;
            if (!last || Date.now() - last > TOKEN_REFRESH_THRESHOLD_MS) {
                try {
                    await auth.refreshIdToken();
                } catch (err) {
                    // surface in dev and capture unexpected failures
                    safeCaptureException(err as Error);
                    if (process.env.NODE_ENV !== 'production')
                        console.debug(
                            '[useFreshToken] refreshIdToken failed',
                            err
                        );
                }
                token = auth.idToken ?? null;
            }
        }

        return token;
    }, [auth]);
}
