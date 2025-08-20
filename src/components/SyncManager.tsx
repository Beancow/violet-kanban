'use client';

import { useEffect, useRef } from 'react';
import { useQueueStore } from '@/store/queueStore';
import { useSyncErrorStore } from '@/store/syncManager';
import log from '@/utils/logHelpers';

export function SyncManager() {
    const { boardActionQueue, listActionQueue, cardActionQueue } =
        useQueueStore();
    const { errors, clearErrors } = useSyncErrorStore();
    const lastQueueLength = useRef(
        boardActionQueue.length +
            listActionQueue.length +
            cardActionQueue.length
    );

    // Show toast for sync errors
    useEffect(() => {
        if (errors.length > 0) {
            // Show toast for each error
            errors.forEach((err) => {
                log('Error', `Sync error: ${err.message}`);
            });
            clearErrors();
        }
    }, [errors, clearErrors]);

    // Show toast for successful sync (all queues empty after having items)
    useEffect(() => {
        const currentLength =
            boardActionQueue.length +
            listActionQueue.length +
            cardActionQueue.length;
        lastQueueLength.current = currentLength;
    }, [boardActionQueue, listActionQueue, cardActionQueue]);

    return null; // This is a manager component, it doesn't render anything.
}
