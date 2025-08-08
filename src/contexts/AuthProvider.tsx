'use client';
import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseAuth, firebaseDB } from '@/lib/firebase/firebase-config';
import {
    createUser,
    getUserFromFirebaseDB,
} from '@/lib/firebase/userServerActions';
import { User } from '@/types/appState.type';
import LoginPage from '@/app/user/login/page';
import LoadingPage from '@/components/LoadingPage';

interface AuthContextType {
    authUser: FirebaseUser | null;
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    authUser: null,
    user: null,
    loading: true,
    logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const logout = async () => {
        await firebaseAuth.signOut();
        localStorage.removeItem('currentOrganizationId');
    };

    useEffect(() => {
        const authUnsubscribe = onAuthStateChanged(
            firebaseAuth,
            async (user) => {
                console.log('Auth state changed:', user);
                setAuthUser(user);
                if (user) {
                    const { data, success } = await getUserFromFirebaseDB(
                        user.uid
                    );
                    if (success && data) {
                        setUser(data);
                    } else {
                        const newUser: User = {
                            id: user.uid,
                            email: user.email || '',
                            displayName: user.displayName || '',
                            photoURL: user.photoURL || '',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            name: user.displayName || '',
                            currentBoardId: null,
                            currentListId: null,
                        };
                        await createUser(newUser);
                        setUser(newUser);
                    }
                } else {
                    setUser(null);
                }
                setLoading(false);
            }
        );

        let userUnsubscribe: () => void;
        if (authUser) {
            const userDocRef = doc(firebaseDB, 'users', authUser.uid);
            userUnsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setUser(doc.data() as User);
                }
            });
        }

        return () => {
            authUnsubscribe();
            if (userUnsubscribe) {
                userUnsubscribe();
            }
        };
    }, [authUser]);

    return (
        <AuthContext.Provider value={{ authUser, user, loading, logout }}>
            {loading ? (
                <LoadingPage dataType='User' />
            ) : authUser ? (
                children
            ) : (
                <LoginPage />
            )}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
};
