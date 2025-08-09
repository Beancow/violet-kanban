"use client";

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
        setUser((prevUser) =>
            prevUser ? { ...prevUser, currentBoardId: boardId } : null
        );
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            if (authUser) {
                setLoading(true);
                try {
                    const idToken = await authUser.getIdToken();
                    const response = await fetch('/api/user', {
                        headers: {
                            Authorization: `Bearer ${idToken}`,
                        },
                    });
                    const result = await response.json();
                    if (result.success && result.data) {
                        setUser(result.data);
                    }
                } catch (error) {
                    console.error("Failed to fetch user data:", error);
                    setUser(null); // Clear user data on error
                } finally {
                    setLoading(false);
                }
            } else {
                setUser(null);
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
                setCurrentBoard,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    return useContext(UserContext);
};