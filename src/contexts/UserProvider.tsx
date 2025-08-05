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
import { setDefaultOrganizationAction } from '@/lib/firebase/userServerActions';
import { getOrganizationAction } from '@/lib/firebase/orgServerActions';

interface UserContextType {
    user: User | null;
    loading: boolean;
    setCurrentBoard: (boardId: string) => void;
    setCurrentOrganization: (organizationId: string) => void;
}

const UserContext = createContext<UserContextType>({
    user: null,
    loading: true,
    setCurrentBoard: () => {},
    setCurrentOrganization: () => {},
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

    const setCurrentOrganization = useCallback((organizationId: string) => {
        setUser((prevUser) =>
            prevUser
                ? { ...prevUser, currentOrganizationId: organizationId }
                : null
        );
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

    const updateCurrentOrganization = useCallback(async () => {
        if (user && user.currentOrganizationId) {
            const { success, error } = await setDefaultOrganizationAction(
                user.id,
                user?.currentOrganizationId
            );
            if (success) {
                
            } else {
                
            }
        }
    }, [user]);

    useEffect(() => {
        const fetchOrg = async () => {
            if (user && user.currentOrganizationId) {
                const { data, success } = await getOrganizationAction(
                    user.currentOrganizationId
                );
                if (success && data) {
                    const member = data.members.find(
                        (member) => member.id === user.id
                    );
                    if (member) {
                        setUser((prevUser) =>
                            prevUser
                                ? {
                                      ...prevUser,
                                      currentOrganization: {
                                          id: data.id,
                                          role: member.role,
                                      },
                                  }
                                : null
                        );
                    }
                }
            }
        };
        fetchOrg();
    }, [user]);

    useEffect(() => {
        updateCurrentOrganization();
    }, [user?.currentOrganizationId, updateCurrentOrganization]);

    return (
        <UserContext.Provider
            value={{ user, loading, setCurrentBoard, setCurrentOrganization }}
        >
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    return useContext(UserContext);
};
