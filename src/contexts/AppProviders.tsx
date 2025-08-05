'use client';
import { AuthProvider } from '@/contexts/AuthProvider';
import { UserProvider } from '@/contexts/UserProvider';
import { OrganizationsProvider } from '@/contexts/OrganizationsProvider';
import { BoardsProvider } from '@/contexts/BoardsProvider';
import { ReactNode } from 'react';

export default function AppProviders({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <UserProvider>
                <OrganizationsProvider>
                    <BoardsProvider>{children}</BoardsProvider>
                </OrganizationsProvider>
            </UserProvider>
        </AuthProvider>
    );
}
