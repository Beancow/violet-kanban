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

interface AuthContextType {
    authUser: FirebaseUser | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    authUser: null,
    loading: true,
    logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(async () => {
        await firebaseAuth.signOut();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
            setAuthUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const contextValue = useMemo(() => ({
        authUser,
        loading,
        logout,
    }), [authUser, loading, logout]);

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