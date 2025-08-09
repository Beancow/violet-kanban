'use client';

import { useEffect, useRef } from 'react';
import { useData } from '@/contexts/DataProvider';
import { useAppToast } from '@/hooks/useToast';

export function SyncManager() {
    const { actionQueue, lastMessage } = useData();
    const { showToast } = useAppToast();
    const lastQueueLength = useRef(actionQueue.length);

    // Effect to show "Queued" toast for actions added while offline
    useEffect(() => {
        if (actionQueue.length > lastQueueLength.current) {
            const newAction = actionQueue[actionQueue.length - 1];
            if (newAction?.payload?.queuedOffline) {
                showToast('Offline', `Action '${newAction.type}' was queued.`);
            }
        }
        lastQueueLength.current = actionQueue.length;
    }, [actionQueue, showToast]);

    // Effect to show "Synced" or "Error" toasts for completed actions
    useEffect(() => {
        if (!lastMessage) return;

        const { type, payload, error } = lastMessage;
        const action = actionQueue.find(a => a.timestamp === payload?.timestamp);

        if (action) {
            if (type === 'ACTION_SUCCESS' && action.payload.queuedOffline) {
                showToast('Success', `'${action.type}' synced successfully!`);
            } else if (type === 'ERROR') {
                showToast('Error', `Failed to sync '${action.type}': ${error.message}`);
            }
        } else if (type === 'FULL_DATA_RECEIVED') {
            showToast('Success', 'Background data sync successful!');
        }
    }, [lastMessage, actionQueue, showToast]);

    return null; // This is a manager component, it doesn't render anything.
}