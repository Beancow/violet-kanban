'use client';
import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase/firebase-config';
import {
    createUser,
    getUserFromFirebaseDB,
} from '@/lib/firebase/userServerActions';
import { User } from '@/types/appState.type';
import LoginPage from '@/app/user/login/page';

interface AuthContextType {
    authUser: FirebaseUser | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    authUser: null,
    loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
            setAuthUser(user);
            if (user) {
                const { success } = await getUserFromFirebaseDB(user.uid);
                if (!success) {
                    const newUser: User = {
                        id: user.uid,
                        email: user.email || '',
                        displayName: user.displayName || '',
                        photoURL: user.photoURL || '',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        name: user.displayName || '',
                        currentBoardId: null,
                        currentOrganizationId: null,
                        currentListId: null,
                        allowedOrgs: [],
                    };
                    await createUser(newUser);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ authUser, loading }}>
            {loading ?
                <div>Loading...</div>
            : authUser ?
                children
            :   <LoginPage />}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
};
