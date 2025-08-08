import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
} from 'react';
import { User } from '@/types/appState.type';
import { useAuth } from '@/contexts/AuthProvider';
import { getUserFromFirebaseDB } from '@/lib/firebase/userServerActions';

interface UserContextType {
    user: User | null;
    loading: boolean;
    currentOrganizationId: string | null;
    setCurrentBoard: (boardId: string) => void;
    setCurrentOrganization: (organizationId: string) => void;
}

const UserContext = createContext<UserContextType>({
    user: null,
    loading: true,
    currentOrganizationId: null,
    setCurrentBoard: () => {},
    setCurrentOrganization: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentOrganizationId, setCurrentOrganizationId] = useState<
        string | null
    >(
        typeof window !== 'undefined' ?
            localStorage.getItem('currentOrganizationId')
        :   null
    );
    const { authUser } = useAuth();

    const setCurrentBoard = useCallback((boardId: string) => {
        setUser((prevUser) =>
            prevUser ? { ...prevUser, currentBoardId: boardId } : null
        );
    }, []);

    const setCurrentOrganization = useCallback((organizationId: string) => {
        localStorage.setItem('currentOrganizationId', organizationId);
        setCurrentOrganizationId(organizationId);
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            if (authUser) {
                const { data, success } = await getUserFromFirebaseDB(
                    authUser.uid
                );
                if (success && data) {
                    setUser(data);
                }
                setLoading(false);
            }
        };
        fetchUser();
    }, [authUser]);

    return (
        <UserContext.Provider
            value={{
                user,
                loading,
                currentOrganizationId,
                setCurrentBoard,
                setCurrentOrganization,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    return useContext(UserContext);
};