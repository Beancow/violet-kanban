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
import LoadingPage from '@/components/LoadingPage';

export interface AuthContextType {
    authUser: FirebaseUser | null;
    loading: boolean;
    logout: () => Promise<void>;
    // current ID token for the signed-in user, or null
    idToken: string | null;
    // force-refresh and return a fresh idToken
    refreshIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
    authUser: null,
    loading: true,
    logout: async () => {},
    idToken: null,
    refreshIdToken: async () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [idToken, setIdToken] = useState<string | null>(null);

    const logout = useCallback(async () => {
        await firebaseAuth.signOut();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
            setAuthUser(user);
            // when auth state changes, attempt to populate idToken
            if (user && typeof user.getIdToken === 'function') {
                user.getIdToken()
                    .then((t) => setIdToken(t))
                    .catch(() => setIdToken(null));
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
            return t;
        } catch (e) {
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
        }),
        [authUser, loading, logout, idToken, refreshIdToken]
    );

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
