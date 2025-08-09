'use client';
import { AuthProvider, useAuth } from '@/contexts/AuthProvider';
import { UserProvider } from '@/contexts/UserProvider';
import { OrganizationsProvider } from '@/contexts/OrganizationsProvider';
import { BoardDataProvider } from '@/contexts/BoardDataProvider';
import { SyncProvider, useSync } from '@/contexts/SyncProvider';
import SyncingOverlay from '@/components/SyncingOverlay';
import ActionQueue from '@/components/ActionQueue';
import { ReactNode } from 'react';
import LoadingPage from '@/components/LoadingPage';
import LoginPage from '@/app/user/login/page';

function AppContent({ children }: { children: ReactNode }) {
    const { isSyncing } = useSync();
    return (
        <>
            {isSyncing && <SyncingOverlay />}
            <ActionQueue />
            {children}
        </>
    );
}

function AuthGate({ children }: { children: ReactNode }) {
    const { authUser, loading } = useAuth();

    if (loading) {
        return <LoadingPage dataType='User' />;
    }

    if (!authUser) {
        return <LoginPage />;
    }

    return (
        <UserProvider>
            <OrganizationsProvider>
                <SyncProvider>
                    <BoardDataProvider>
                        <AppContent>{children}</AppContent>
                    </BoardDataProvider>
                </SyncProvider>
            </OrganizationsProvider>
        </UserProvider>
    );
}

export default function AppProviders({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <AuthGate>{children}</AuthGate>
        </AuthProvider>
    );
}