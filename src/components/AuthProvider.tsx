'use client';
import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import { firebaseAuth } from '@/lib/firebase/firebase-config'; // Adjust the import path as needed
import { Box, Spinner } from '@radix-ui/themes';
import { getAllOrganizationsAction } from '@/lib/firebase/orgServerActions';

interface AuthContextType {
    user: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
            setUser(user);
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

        if (!user && !isAuthPage) {
            router.push('/user/login');
        } else if (user && isAuthPage) {
            router.push('/user');
        } else if (user && !isOrgPage) {
            const checkOrgs = async () => {
                const orgs = await getAllOrganizationsAction();
                if (!orgs.data || orgs.data.length === 0) {
                    router.push('/org');
                } else {
                    router.push('/user');
                }
            };
            checkOrgs();
        }
    }, [user, loading, pathname, router, isAuthPage, isOrgPage]);

    if (loading || (!user && !isAuthPage) || (user && isAuthPage)) {
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
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
};
