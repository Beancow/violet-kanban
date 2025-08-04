'use client';
import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import { firebaseAuth } from '@/lib/firebase/firebase-config';
import { Box, Spinner } from '@radix-ui/themes';
import { getAllOrganizationsAction } from '@/lib/firebase/orgServerActions';
import { getUser, createUser } from '@/lib/firebase/userServerActions';
import { User } from '@/types/appState.type';

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
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
            setAuthUser(user);
            if (user) {
                const { success } = await getUser(user.uid);
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
                        allowedOrgs: [],
                    };
                    await createUser(newUser);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const isAuthPage = pathname === '/user/login';
    const isOrgPage = pathname.startsWith('/org');

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!authUser && !isAuthPage) {
            router.push('/user/login');
        } else if (authUser && isAuthPage) {
            router.push('/user');
        } else if (authUser && !isOrgPage) {
            const checkOrgs = async () => {
                const orgs = await getAllOrganizationsAction();
                if (!orgs.data || orgs.data.length === 0) {
                    router.push('/orgs');
                } else {
                    router.push('/user');
                }
            };
            checkOrgs();
        }
    }, [authUser, loading, pathname, router, isAuthPage, isOrgPage]);

    if (loading || (!authUser && !isAuthPage) || (authUser && isAuthPage)) {
        return (
            <Box
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                <Spinner size='3' />
            </Box>
        );
    }

    return (
        <AuthContext.Provider value={{ authUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
};
