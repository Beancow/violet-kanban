
"use client";
import { AuthProvider } from '@/components/AuthProvider';
import { UserProvider } from '@/contexts/UserProvider';
import { OrganizationsProvider } from '@/contexts/OrganizationsProvider';
import { BoardsProvider } from '@/contexts/BoardsProvider';
import { TodosProvider } from '@/contexts/TodosProvider';
import { ReactNode } from 'react';

export default function AppProviders({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <UserProvider>
                <OrganizationsProvider>
                    <BoardsProvider>
                        <TodosProvider>{children}</TodosProvider>
                    </BoardsProvider>
                </OrganizationsProvider>
            </UserProvider>
        </AuthProvider>
    );
}
