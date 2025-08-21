'use client';
import React, { useEffect } from 'react';
import { initializeBoardStore } from '@/store/boardStore';

export function BoardStoreProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    useEffect(() => {
        // Ensure the board store is created client-side. Any browser-only
        // initialization related to boards can live here.
        try {
            initializeBoardStore();
        } catch (_) {
            // Swallow errors during SSR detection or in environments without window
        }
        return () => {
            // No cleanup required for the store itself; add cleanup if needed later.
        };
    }, []);

    return <>{children}</>;
}

export default BoardStoreProvider;
