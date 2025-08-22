'use client';
import React, { useEffect } from 'react';
import { initializeOrganizationStore } from '@/store/organizationStore';

export function OrganizationStoreProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    if (typeof window !== 'undefined') {
        try {
            initializeOrganizationStore();
        } catch {
            // ignore during SSR
        }
    }
    useEffect(() => {
        // no-op effect; store already initialized synchronously on client
        return () => {};
    }, []);
    return <>{children}</>;
}

export default OrganizationStoreProvider;
