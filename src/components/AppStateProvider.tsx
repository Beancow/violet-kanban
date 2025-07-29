'use client';
import { useCallback, useEffect, useState } from 'react';
import { AuthProvider } from '@/components/AuthProvider';
import React from 'react';
import {
    Boards,
    Todo,
    User,
    OrganizationMember,
    Organization,
} from '@/types/appState.type';

const testAppState: Omit<
    AppState,
    'setUser' | 'setBoards' | 'setTodos' | 'setOrganizations'
> = {
    user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        photoURL: 'https://example.com/test.jpg',
        currentBoardId: '1',
        currentOrganizationId: '1',
        allowedOrgs: ['1'],
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    boards: [
        {
            id: '1',
            title: 'Test Board',
            description: 'Test Description',
            createdAt: new Date(),
            updatedAt: new Date(),
            ownerId: '1',
            organizationId: '1',
            lists: [
                {
                    id: '1',
                    title: 'Test List',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    boardId: '1',
                },
            ],
            data: {
                color: 'blue',
                icon: 'check',
                backgroundImage: 'https://example.com/background.jpg',
            },
            members: [
                {
                    userId: '1',
                    name: 'Test Member',
                    role: 'owner',
                    joinedAt: new Date(),
                    leftAt: undefined,
                },
            ],
            archived: false,
            deleted: false,
            isPublic: true,
        },
    ],
    todos: [
        {
            id: '1',
            title: 'Test Todo',
            description: 'Test Description',
            completed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            boardId: '1',
            userId: '1',
        },
    ],
    organizations: [
        {
            id: '1',
            name: 'Test Organization',
            type: 'personal',
            members: [
                {
                    id: '1',
                    name: 'Test Member',
                    photoURL: 'https://example.com/member.jpg',
                    updatedAt: new Date(),
                    createdAt: new Date(),
                    isAdmin: true,
                    isOwner: true,
                },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
            data: {
                companyName: 'Test Company',
                companyWebsite: 'https://example.com',
                logoURL: 'https://example.com/logo.jpg',
            },
        },
        {
            id: '2',
            name: 'Another Organization',
            type: 'company',
            members: [
                {
                    id: '2',
                    name: 'Another Member',
                    photoURL: 'https://example.com/another-member.jpg',
                    updatedAt: new Date(),
                    createdAt: new Date(),
                    isAdmin: false,
                    isOwner: false,
                },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
            data: {
                companyName: 'Another Company',
                companyWebsite: 'https://another-example.com',
                logoURL: 'https://another-example.com/logo.jpg',
            },
        },
    ],
};

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

    const loadTestData = useCallback(() => {
        setUser(testAppState.user);
        setBoards(testAppState.boards);
        setTodos(testAppState.todos);
        setOrganizations(testAppState.organizations);
    }, []);

    useEffect(() => {
        loadTestData();
    }, [loadTestData]);

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
        async (keyname: string, data: any) => {
            localStorage.setItem(keyname, JSON.stringify(data));
        },
        []
    );

    useEffect(() => {
        if (user) {
            const userData = {
                id: user.id,
                name: user.name,
                email: user.email,
                photoURL: user.photoURL,
                currentBoardId: 1752771419502,
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
            <AuthProvider>{children}</AuthProvider>
        </AppStateContext.Provider>
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
