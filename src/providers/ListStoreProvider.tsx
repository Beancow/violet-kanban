'use client';
import React, { useEffect } from 'react';
import { initializeListStore } from '@/store/listStore';

export function ListStoreProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        try {
            initializeListStore();
        } catch (_) {
            // ignore in non-browser environments
        }
        return () => {};
    }, []);
    return <>{children}</>;
}

export default ListStoreProvider;
