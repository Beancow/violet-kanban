'use client';
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

export interface AuthContextType {
    authUser: FirebaseUser | null;
    loading: boolean;
    logout: () => Promise<void>;
    // current ID token for the signed-in user, or null
    idToken: string | null;
    // force-refresh and return a fresh idToken
    refreshIdToken: () => Promise<string | null>;
    // whether the client previously had authentication recorded in storage
    hasAuth: boolean;
    // minimal persisted user info (may be null)
    storedUser: {
        uid?: string;
        displayName?: string | null;
        email?: string | null;
    } | null;
}

const AuthContext = createContext<AuthContextType>({
    authUser: null,
    loading: true,
    logout: async () => {},
    idToken: null,
    refreshIdToken: async () => null,
    hasAuth: false,
    storedUser: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
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

        return () => unsubscribe();
    }, []);

    const refreshIdToken = useCallback(async () => {
        if (!authUser || typeof authUser.getIdToken !== 'function') return null;
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
            return t;
        } catch (e) {
            safeCaptureException(e);
            setIdToken(null);
            return null;
        }
    }, [authUser]);
    const contextValue = useMemo(
        () => ({
            authUser,
            loading,
            logout,
            idToken,
            refreshIdToken,
            hasAuth,
            storedUser,
        }),
        [
            authUser,
            loading,
            logout,
            idToken,
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
