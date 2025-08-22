'use client';
import React, { useEffect } from 'react';
import { initializeQueueStore } from '@/store/queueStore';
import { initializeTempIdMapStore } from '@/store/tempIdMapStore';

export function QueueStoreProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    if (typeof window !== 'undefined') {
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
    }

    useEffect(() => {
        // no-op effect; stores were initialized synchronously on client
        return () => {};
    }, []);

    return <>{children}</>;
}

export default QueueStoreProvider;
