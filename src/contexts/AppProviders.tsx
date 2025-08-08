'use client';
import { AuthProvider } from '@/contexts/AuthProvider';
import { UserProvider } from '@/contexts/UserProvider';
import { OrganizationsProvider } from '@/contexts/OrganizationsProvider';
import { AuthProvider } from '@/contexts/AuthProvider';
import { UserProvider } from '@/contexts/UserProvider';
import { OrganizationsProvider } from '@/contexts/OrganizationsProvider';
import { BoardDataProvider } from '@/contexts/BoardDataProvider';
import { SyncProvider, useSync } from '@/contexts/SyncProvider';
import SyncingOverlay from '@/components/SyncingOverlay';
import ActionQueue from '@/components/ActionQueue';
import { ReactNode } from 'react';

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

export default function AppProviders({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <UserProvider>
                <OrganizationsProvider>
                    <SyncProvider>
                        <BoardDataProvider>
                            <AppContent>{children}</AppContent>
                        </BoardDataProvider>
                    </SyncProvider>
                </OrganizationsProvider>
            </UserProvider>
        </AuthProvider>
    );
}
