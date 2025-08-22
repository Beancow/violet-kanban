'use client';
import React, { useEffect } from 'react';
import { initializeQueueStore } from '@/store/queueStore';
import { initializeTempIdMapStore } from '@/store/tempIdMapStore';

export function QueueStoreProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    useEffect(() => {
        // Ensure queue and temp id map stores are initialized client-side.
        try {
            initializeTempIdMapStore();
        } catch {
            // ignore in non-browser
        }
        try {
            initializeQueueStore();
        } catch {
            // ignore in non-browser
        }
        // Sync lifecycle is managed by the <SyncManager/> component mounted in layout

        return () => {
            // syncManager handles its own cleanup for intervals/listeners if implemented
        };
    }, []);

    return <>{children}</>;
}

export default QueueStoreProvider;
