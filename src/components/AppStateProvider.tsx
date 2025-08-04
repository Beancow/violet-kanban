'use client';
import { useCallback, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import React from 'react';
import {
    Boards,
    Todo,
    User,
    OrganizationMember,
    Organization,
} from '@/types/appState.type';
import { getUser } from '@/lib/firebase/userServerActions';

type AppState = {
    user: User | null;
    boards: Boards[];
    todos: Todo[];
    organizations: Organization[];
    setUser: (user: User | null) => void;
    setBoards: (boards: Boards[]) => void;
    setTodos: (todos: Todo[]) => void;
    setOrganizations: (organizations: Organization[]) => void;
    updateOrgMembers?: (orgId: string, members: OrganizationMember[]) => void;
    backupUser?: () => void;
    isWorkerReady?: boolean;
    workerError?: string | null;
};

const AppStateContext = React.createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [boards, setBoards] = useState<Boards[]>([]);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const { authUser } = useAuth();

    const loadFromIndexedDB = useCallback(async () => {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            setUser(JSON.parse(storedUserData));
        }
        const storedBoards = localStorage.getItem('boards');
        const storedTodos = localStorage.getItem('todos');
        const storedOrganizations = localStorage.getItem('organizations');

        if (storedBoards && storedBoards !== 'undefined')
            setBoards(JSON.parse(storedBoards));
        if (storedTodos && storedTodos !== 'undefined')
            setTodos(JSON.parse(storedTodos));
        if (storedOrganizations && storedOrganizations !== 'undefined')
            setOrganizations(JSON.parse(storedOrganizations));
    }, []);

    useEffect(() => {
        loadFromIndexedDB();
    }, [loadFromIndexedDB]);

    const storeDataToIndexedDB = useCallback(
        async (
            keyname: string,
            data: User | Boards[] | Todo[] | Organization[]
        ) => {
            localStorage.setItem(keyname, JSON.stringify(data));
        },
        []
    );

    useEffect(() => {
        if (user) {
            const userData = {
                id: user.id,
                name: user.name,
                displayName: user.name,
                email: user.email,
                photoURL: user.photoURL,
                currentBoardId: '1752771419502',
                currentOrganizationId: user.currentOrganizationId,
            };
            storeDataToIndexedDB('userData', userData);
        }
    }, [user, storeDataToIndexedDB]);

    useEffect(() => {
        if (boards && boards.length > 0) {
            storeDataToIndexedDB('boards', boards);
        }
    }, [boards, storeDataToIndexedDB]);

    useEffect(() => {
        if (todos && todos.length > 0) {
            storeDataToIndexedDB('todos', todos);
        }
    }, [todos, storeDataToIndexedDB]);

    useEffect(() => {
        if (organizations && organizations.length > 0) {
            storeDataToIndexedDB('organizations', organizations);
        }
    }, [organizations, storeDataToIndexedDB]);

    useEffect(() => {
        const fetchUserData = async () => {
            if (authUser) {
                const { data, success } = await getUser(authUser.uid);
                if (success && data) {
                    setUser(data);
                }
            }
        };
        fetchUserData();
    }, [authUser]);

    const updateOrgMembers = useCallback(
        (orgId: string, members: OrganizationMember[]) => {
            setOrganizations((prevOrgs) => {
                return prevOrgs.map((org) => {
                    if (org.id === orgId) {
                        return { ...org, members };
                    }
                    return org;
                });
            });
        },
        []
    );

    return (
        <AppStateContext.Provider
            value={{
                user,
                boards,
                todos,
                organizations,
                updateOrgMembers,
                setUser,
                setBoards,
                setTodos,
                setOrganizations,
            }}
        >
            {children}
        </AppStateContext.Provider>
    );
}

export default function AppStateProviderWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <AppStateProvider>{children}</AppStateProvider>
        </AuthProvider>
    );
}

export function useAppState() {
    const context = React.useContext(AppStateContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within an AppStateProvider');
    }
    return context;
}
export { AppStateContext };
