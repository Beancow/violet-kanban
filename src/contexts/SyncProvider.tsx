'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useWebWorker } from '@/hooks/useWebWorker';
import { Action } from '@/types/sync.type';
import { Board, List, BoardCard } from '@/types/appState.type';
import { useAuth } from './AuthProvider';
import { useAppToast } from '@/hooks/useToast';

interface SyncContextType {
    isSyncing: boolean;
    isEditing: boolean;
    actionQueue: Action[];
    setIsEditing: (isEditing: boolean) => void;
    addActionToQueue: (action: Action) => void;
    processActionQueue: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [actionQueue, setActionQueue] = useLocalStorage<Action[]>('actionQueue', []);
    const [currentOrganizationId] = useLocalStorage<string | null>('currentOrganizationId', null);
    const [, setBoards] = useLocalStorage<Board[]>('boards', []);
    const [, setLists] = useLocalStorage<List[]>('lists', []);
    const [, setCards] = useLocalStorage<BoardCard[]>('cards', []);
    const { postMessage, lastMessage, isWorkerReady } = useWebWorker();
    const { authUser } = useAuth();
    const { showToast } = useAppToast();

    const processActionQueue = useCallback(async () => {
        if (isEditing || actionQueue.length === 0 || !isWorkerReady || !navigator.onLine) {
            return;
        }
        const idToken = await authUser?.getIdToken();
        const orgId = currentOrganizationId;
        if (!idToken || !orgId) {
            return;
        }
        setIsSyncing(true);
        actionQueue.forEach(action => {
            const payload = { ...action.payload, idToken, orgId };
            postMessage({ ...action, payload });
        });
    }, [actionQueue, isEditing, isWorkerReady, authUser, currentOrganizationId, postMessage]);

    useEffect(() => {
        if (actionQueue.length === 0) {
            setIsSyncing(false);
        }
    }, [actionQueue]);

    useEffect(() => {
        if (isWorkerReady && authUser) {
            const initiateBackgroundSync = async () => {
                if (!currentOrganizationId) return;
                const lastSyncTimestamp = localStorage.getItem(`lastSyncTimestamp_${currentOrganizationId}`);
                const oneMinute = 60 * 1000;
                if (!lastSyncTimestamp || (Date.now() - parseInt(lastSyncTimestamp, 10)) > oneMinute) {
                    const idToken = await authUser.getIdToken();
                    postMessage({ type: 'FETCH_FULL_DATA', payload: { orgId: currentOrganizationId, idToken } });
                }
            };
            initiateBackgroundSync();
            if (navigator.onLine) {
                processActionQueue();
            }
        }
    }, [isWorkerReady, authUser, currentOrganizationId, postMessage, processActionQueue]);

    useEffect(() => {
        if (!lastMessage) return;

        switch (lastMessage.type) {
            case 'ACTION_SUCCESS':
                const successfulAction = actionQueue.find(action => action.timestamp === lastMessage.payload.timestamp);
                if (successfulAction) {
                    setTimeout(() => {
                        showToast('Success', `${successfulAction.type} synced successfully!`);
                    }, 0);
                    setActionQueue(prevQueue => prevQueue.filter(action => action.timestamp !== lastMessage.payload.timestamp));
                }
                break;
            
            case 'FULL_DATA_RECEIVED':
                const { boards, lists, cards } = lastMessage.payload;
                setBoards(boards || []);
                setLists(lists || []);
                setCards(cards || []);
                if (currentOrganizationId) {
                    localStorage.setItem(`lastSyncTimestamp_${currentOrganizationId}`, Date.now().toString());
                }
                setTimeout(() => {
                    showToast('Success', 'Background data sync successful!');
                }, 0);
                break;

            case 'RECONCILE_BOARD_ID':
                const { tempId, board } = lastMessage.payload;
                setBoards(prevBoards => {
                    const newBoards = [...prevBoards];
                    const boardIndex = newBoards.findIndex(b => b.id === tempId);
                    if (boardIndex !== -1) {
                        newBoards[boardIndex] = board;
                    }
                    return newBoards;
                });
                break;
        }
    }, [lastMessage, actionQueue, setActionQueue, showToast, setBoards, setLists, setCards, currentOrganizationId]);

    useEffect(() => {
        const handleOnline = () => {
            processActionQueue();
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [processActionQueue]);

    const addActionToQueue = useCallback((action: Action) => {
        setActionQueue((prevQueue) => [...prevQueue, action]);
    }, [setActionQueue]);

    return (
        <SyncContext.Provider
            value={{ isSyncing, isEditing, actionQueue, setIsEditing, addActionToQueue, processActionQueue }}
        >
            {children}
        </SyncContext.Provider>
    );
}

export const useSync = () => {
    const context = useContext(SyncContext);
    if (context === undefined) {
        throw new Error('useSync must be used within a SyncProvider');
    }
    return context;
};