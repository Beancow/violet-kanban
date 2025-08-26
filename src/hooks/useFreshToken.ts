'use client';
import { useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';

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
                } catch (e) {
                    // ignore - refreshIdToken manages its own state and cooldown
                }
                token = auth.idToken ?? null;
            }
        }

        return token;
    }, [auth]);
}
