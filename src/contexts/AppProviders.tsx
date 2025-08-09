'use client';
import { AuthProvider, useAuth } from '@/contexts/AuthProvider';
import { UserProvider } from '@/contexts/UserProvider';
import { OrganizationsProvider } from '@/contexts/OrganizationsProvider';
import { BoardDataProvider } from '@/contexts/BoardDataProvider';
import { SyncProvider, useSync } from '@/contexts/SyncProvider';
import SyncingOverlay from '@/components/SyncingOverlay';
import FloatingSyncButton from '@/app/components/FloatingSyncButton';
import React, { useState, useCallback, ReactNode } from 'react';
import LoadingPage from '@/components/LoadingPage';
import LoginPage from '@/app/user/login/page';
import { ToastContext } from '@/hooks/useToast';
import {
    ToastProvider as RadixToastProvider,
    ToastRoot,
    ToastTitle,
    ToastDescription,
    ToastClose,
    ToastViewport,
} from '@/components/Toast';

export type ToastMessage = {
    id: string;
    title: string;
    description?: string;
};

const AppToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((title: string, description?: string) => {
        const id = new Date().toISOString() + Math.random();
        setToasts(prevToasts => [...prevToasts, { id, title, description }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, toasts, removeToast }}>
            {children}
            <RadixToastProvider>
                {toasts.map(({ id, title, description }) => (
                    <ToastRoot key={id} onOpenChange={() => removeToast(id)} open={true} duration={5000}>
                        <ToastTitle>{title}</ToastTitle>
                        {description && <ToastDescription>{description}</ToastDescription>}
                        <ToastClose />
                    </ToastRoot>
                ))}
                <ToastViewport />
            </RadixToastProvider>
        </ToastContext.Provider>
    );
};

function AppContent({ children }: { children: ReactNode }) {
    const { isSyncing } = useSync();
    return (
        <>
            {isSyncing && <SyncingOverlay />}
            <FloatingSyncButton />
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
                <BoardDataProvider>
                    <AppContent>{children}</AppContent>
                </BoardDataProvider>
            </OrganizationsProvider>
        </UserProvider>
    );
}

export default function AppProviders({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <AppToastProvider>
                <SyncProvider>
                    <AuthGate>{children}</AuthGate>
                </SyncProvider>
            </AppToastProvider>
        </AuthProvider>
    );
}