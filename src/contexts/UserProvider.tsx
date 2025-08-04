'use client';
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
    setCurrentBoard: (boardId: string) => void;
}

const UserContext = createContext<UserContextType>({
    user: null,
    loading: true,
    setCurrentBoard: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { authUser } = useAuth();

    const setCurrentBoard = useCallback((boardId: string) => {
        if (user) {
            setUser({ ...user, currentBoardId: boardId });
        }
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
        <UserContext.Provider value={{ user, loading, setCurrentBoard }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    return useContext(UserContext);
};
