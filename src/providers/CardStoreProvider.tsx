'use client';
import React, { useEffect } from 'react';
import { initializeCardStore } from '@/store/cardStore';

export function CardStoreProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        try {
            initializeCardStore();
        } catch {
            // ignore in SSR
        }
        return () => {};
    }, []);
    return <>{children}</>;
}

export default CardStoreProvider;
