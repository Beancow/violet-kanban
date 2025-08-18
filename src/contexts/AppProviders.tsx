'use client';
import { AuthProvider, useAuth } from '@/contexts/AuthProvider';
import { UserProvider } from '@/contexts/UserProvider';
import { OrganizationsProvider } from '@/contexts/OrganizationsProvider';
import { DataProvider } from '@/contexts/DataProvider';
import React, { ReactNode } from 'react';
import LoadingPage from '@/components/LoadingPage';
import LoginPage from '@/app/user/login/page';
import { AppToastProvider } from './ToastProvider';

function AppContent({ children }: { children: ReactNode }) {
    return <>{children}</>;
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
                <AppContent>{children}</AppContent>
            </OrganizationsProvider>
        </UserProvider>
    );
}

export default function AppProviders({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <AppToastProvider>
                <DataProvider>
                    <AuthGate>{children}</AuthGate>
                </DataProvider>
            </AppToastProvider>
        </AuthProvider>
    );
}
