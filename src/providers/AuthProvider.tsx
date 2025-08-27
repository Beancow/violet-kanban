'use client';
// debug: module load trace for test triage
// eslint-disable-next-line no-console
console.debug && console.debug('[module-load] src/providers/AuthProvider');
import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useMemo,
    useCallback,
} from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase/firebase-config';
import { getTokenExpiryMs } from '@/lib/firebase/firebaseHelpers';
import { safeCaptureException } from '@/lib/sentryWrapper';
import LoadingPage from '@/components/LoadingPage';
import type { AuthApi } from '@/types/provider-apis';

const AuthContext = createContext<AuthApi>({
    authUser: null,
    loading: true,
    logout: async () => {},
    idToken: null,
    refreshIdToken: async () => null,
    hasAuth: false,
    storedUser: null,
});

import AuthGuard from './AuthGuard';

export function AuthProvider({
    children,
    withGuard = false,
}: {
    children: ReactNode;
    withGuard?: boolean;
}) {
    const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    // new storage key (versioned)
    const STORAGE_KEY = 'violet-kanban-auth-v1';
    // how old (ms) before we proactively refresh token when rehydrating
    const TOKEN_REFRESH_THRESHOLD_MS = 50 * 60 * 1000; // 50 minutes

    // proactively refresh when token expiry is within this margin
    const TOKEN_REFRESH_MARGIN_MS = 10 * 60 * 1000; // 10 minutes

    // Do not hydrate idToken from storage. Only hydrate hasAuth and storedUser.
    const [idToken, setIdToken] = useState<string | null>(null);

    const [hasAuth, setHasAuth] = useState<boolean>(() => {
        try {
            if (typeof window !== 'undefined') {
                const raw = window.localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw) as { hasAuth?: boolean };
                    return Boolean(parsed && parsed.hasAuth);
                }
            }
        } catch (e) {
            console.error(
                '[auth] failed to read auth storage from localStorage',
                e
            );
            safeCaptureException(e);
        }
        return false;
    });

    const [storedUser, setStoredUser] = useState<{
        uid?: string;
        displayName?: string | null;
        email?: string | null;
    } | null>(() => {
        try {
            if (typeof window !== 'undefined') {
                const raw = window.localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw) as {
                        user?: {
                            uid?: string;
                            displayName?: string | null;
                            email?: string | null;
                        } | null;
                    };
                    return (parsed && parsed.user) || null;
                }
            }
        } catch (e) {
            console.error(
                '[auth] failed to read auth storage from localStorage',
                e
            );
            safeCaptureException(e);
        }
        return null;
    });

    const [lastAuthAt, setLastAuthAt] = useState<number | null>(() => {
        try {
            if (typeof window !== 'undefined') {
                const raw = window.localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw) as {
                        lastAuthAt?: number | null;
                    };
                    return (
                        (parsed && (parsed.lastAuthAt as number | null)) || null
                    );
                }
            }
        } catch (e) {
            console.error(
                '[auth] failed to read auth storage from localStorage',
                e
            );
            safeCaptureException(e);
        }
        return null;
    });

    const logout = useCallback(async () => {
        await firebaseAuth.signOut();
    }, []);

    // Track refresh failure state to avoid tight retry loops that can exhaust
    // securetoken quotas. We implement exponential backoff and a longer
    // cooldown when the error indicates quota/rate-limiting.
    const [failedRefreshCount, setFailedRefreshCount] = useState(0);
    const [refreshCooldownUntil, setRefreshCooldownUntil] = useState<
        number | null
    >(null);
    const REFRESH_MAX_BACKOFF_MS = 60 * 60 * 1000; // 1 hour
    const REFRESH_QUOTA_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

    useEffect(() => {
        let _fired = false;
        const SAFETY_MS = 5000;
        let safetyTimer: number | undefined = undefined;

        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
            _fired = true;
            try {
                if (typeof safetyTimer !== 'undefined')
                    window.clearTimeout(safetyTimer);
            } catch (_) {}

            setAuthUser(user);

            // update minimal stored user info and hasAuth flag
            if (user) {
                setStoredUser({
                    uid: user.uid,
                    displayName: user.displayName ?? null,
                    email: user.email ?? null,
                });
                setHasAuth(true);
            } else {
                setStoredUser(null);
                setHasAuth(false);
            }

            // when auth state changes, attempt to populate idToken (do not persist)
            if (user && typeof user.getIdToken === 'function') {
                (async () => {
                    try {
                        const t = await user.getIdToken();
                        setIdToken(t);
                        setLastAuthAt(Date.now());
                    } catch (err) {
                        safeCaptureException(err);
                        setIdToken(null);
                    }
                })();
            } else {
                setIdToken(null);
            }
            setLoading(false);
        });

        // safety: if onAuthStateChanged doesn't invoke within SAFETY_MS, stop showing
        // the loading UI so app can proceed; this helps local dev where the auth
        // SDK may be slow or misconfigured.
        try {
            if (typeof window !== 'undefined') {
                safetyTimer = window.setTimeout(() => {
                    if (!_fired) {
                        // Log for diagnostics and allow UI to progress.
                        // eslint-disable-next-line no-console
                        console.warn(
                            '[AuthProvider] auth state callback not received within timeout; clearing loading'
                        );
                        setLoading(false);
                    }
                }, SAFETY_MS) as unknown as number;
            }
        } catch (_) {}

        return () => {
            try {
                if (typeof safetyTimer !== 'undefined')
                    window.clearTimeout(safetyTimer);
            } catch (_) {}
            unsubscribe();
        };
    }, []);

    const refreshIdToken = useCallback(async () => {
        if (!authUser || typeof authUser.getIdToken !== 'function') return null;
        // honor cooldown windows to avoid tight retry loops
        if (refreshCooldownUntil && Date.now() < refreshCooldownUntil) {
            // still cooling down
            return null;
        }
        try {
            const t = await authUser.getIdToken(true);
            setIdToken(t);
            // record when we last successfully obtained a token
            const now = Date.now();
            setLastAuthAt(now);
            // update stored user info in case it was out of date
            setStoredUser({
                uid: authUser.uid,
                displayName: authUser.displayName ?? null,
                email: authUser.email ?? null,
            });
            setHasAuth(true);
            // reset failure/backoff state on success
            setFailedRefreshCount(0);
            setRefreshCooldownUntil(null);
            return t;
        } catch (e) {
            // Log the failure and set backoff/cooldown so we don't loop.
            safeCaptureException(e);
            setIdToken(null);
            setFailedRefreshCount((c) => c + 1);

            // Detect quota/rate-limit style errors and apply a long cooldown.
            const msg =
                e && (e as any).message
                    ? String((e as any).message).toLowerCase()
                    : '';
            const code =
                e && (e as any).code
                    ? String((e as any).code).toLowerCase()
                    : '';
            const isQuotaError =
                msg.includes('quota') ||
                msg.includes('rate') ||
                msg.includes('429') ||
                code.includes('too-many-requests') ||
                code.includes('quota');

            if (isQuotaError) {
                // aggressive cooldown for quota errors
                setRefreshCooldownUntil(Date.now() + REFRESH_QUOTA_COOLDOWN_MS);
            } else {
                // exponential backoff for other failures: min(60s * 2^(n-1), cap)
                const attempts = Math.max(1, failedRefreshCount + 1);
                const backoffMs = Math.min(
                    60 * 1000 * Math.pow(2, attempts - 1),
                    REFRESH_MAX_BACKOFF_MS
                );
                setRefreshCooldownUntil(Date.now() + backoffMs);
            }

            return null;
        }
    }, [authUser]);
    const contextValue = useMemo(
        () => ({
            authUser,
            loading,
            logout,
            idToken,
            lastAuthAt,
            refreshIdToken,
            hasAuth,
            storedUser,
        }),
        [
            authUser,
            loading,
            logout,
            idToken,
            lastAuthAt,
            refreshIdToken,
            hasAuth,
            storedUser,
        ]
    );

    // Persist only the non-sensitive parts (hasAuth and storedUser) to localStorage.
    useEffect(() => {
        try {
            if (typeof window === 'undefined') return;
            const payload = {
                hasAuth: Boolean(hasAuth),
                user: storedUser ?? null,
                lastAuthAt: lastAuthAt ?? null,
            };
            const shouldRemove =
                !payload.hasAuth && !payload.user && !payload.lastAuthAt;
            if (shouldRemove) {
                window.localStorage.removeItem(STORAGE_KEY);
            } else {
                window.localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(payload)
                );
            }
        } catch (e) {
            console.error(
                '[auth] failed to write auth storage to localStorage',
                e
            );
            safeCaptureException(e);
        }
    }, [hasAuth, storedUser, lastAuthAt]);

    // If we previously had auth, and a Firebase user becomes available, decide whether to refresh the token.
    useEffect(() => {
        if (!hasAuth || !authUser || typeof authUser.getIdToken !== 'function')
            return;

        let shouldRefresh = false;
        if (idToken) {
            const expMs = getTokenExpiryMs(idToken);
            if (expMs) {
                // refresh if token will expire within margin
                shouldRefresh = expMs - Date.now() < TOKEN_REFRESH_MARGIN_MS;
            } else {
                // fallback to lastAuthAt threshold
                shouldRefresh =
                    !lastAuthAt ||
                    Date.now() - lastAuthAt > TOKEN_REFRESH_THRESHOLD_MS;
            }
        } else {
            shouldRefresh =
                !lastAuthAt ||
                Date.now() - lastAuthAt > TOKEN_REFRESH_THRESHOLD_MS;
        }

        if (shouldRefresh) {
            // trigger a refresh; ignore result here (refreshIdToken handles state)
            void refreshIdToken();
        }
    }, [hasAuth, authUser, refreshIdToken, lastAuthAt, idToken]);

    if (loading) {
        return <LoadingPage dataType='user' />;
    }

    return (
        <AuthContext.Provider value={contextValue}>
            {withGuard && <AuthGuard />}
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
