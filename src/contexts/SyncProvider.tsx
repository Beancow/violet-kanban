'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useWebWorker } from '@/hooks/useWebWorker';
import { Action } from '@/types/sync.type';
import { useAuth } from './AuthProvider';

interface SyncContextType {
    isSyncing: boolean;
    isEditing: boolean;
    actionQueue: Action[];
    setIsEditing: (isEditing: boolean) => void;
    addActionToQueue: (action: Action) => void;
}

const SyncContext = createContext<SyncContextType>({
    isSyncing: false,
    isEditing: false,
    actionQueue: [],
    setIsEditing: () => {},
    addActionToQueue: () => {},
});

export function SyncProvider({ children }: { children: ReactNode }) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [actionQueue, setActionQueue] = useLocalStorage<Action[]>('actionQueue', []);
    const { syncData } = useWebWorker();
    const { authUser } = useAuth();

    const processActionQueue = useCallback(async () => {
        if (isEditing) {
            console.log('Paused queue processing because user is editing.');
            return;
        }

        const idToken = await authUser?.getIdToken();
        if (!idToken) {
            console.error('Cannot sync: User not authenticated or token unavailable.');
            setIsSyncing(false);
            return;
        }

        setIsSyncing(true);
        const queue = [...actionQueue];
        while (queue.length > 0) {
            const action = queue.shift();
            // Pass the fresh idToken with the action to the worker
            syncData({ ...action, payload: { ...action.payload, idToken } });
        }
        setActionQueue(queue);
        setIsSyncing(false);
    }, [actionQueue, isEditing, setActionQueue, syncData, authUser]);

    useEffect(() => {
        const handleOnline = () => {
            processActionQueue();
        };

        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, [processActionQueue]);

    const memoizedSetIsEditing = useCallback(setIsEditing, [setIsEditing]);

    const addActionToQueue = useCallback((action: Action) => {
        setActionQueue((prevQueue) => [...prevQueue, action]);
    }, [setActionQueue]);

    return (
        <SyncContext.Provider
            value={{
                isSyncing,
                isEditing,
                actionQueue,
                setIsEditing: memoizedSetIsEditing,
                addActionToQueue,
            }}
        >
            {children}
        </SyncContext.Provider>
    );
}

export const useSync = () => {
    return useContext(SyncContext);
};