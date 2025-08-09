/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useWebWorker } from '@/hooks/useWebWorker';
import { Action } from '@/types/sync.type';
import { Board, BoardList, BoardCard } from '@/types/appState.type';
import { useAuth } from './AuthProvider';
import { DataState } from '@/types/reducer.type';
import { rootReducer } from './reducers';

const initialState: DataState = {
    isSyncing: false,
    isEditing: false,
    actionQueue: [],
    boards: [],
    lists: [],
    cards: [],
    lastMessage: null,
    tempIdMap: {},
};

// --- Context ---

interface DataContextType extends DataState {
    setIsEditing: (isEditing: boolean) => void;
    createBoard: (title: string, description: string) => void;
    updateBoard: (boardId: string, data: Partial<Board>) => void;
    deleteBoard: (boardId: string) => void;
    createCard: (listId: string, boardId: string, title: string, description: string, priority: number) => void;
    updateCard: (boardId: string, cardId: string, data: Partial<BoardCard>) => void;
    deleteCard: (boardId: string, cardId: string) => void;
    softDeleteCard: (boardId: string, cardId: string) => void;
    restoreCard: (boardId: string, cardId: string) => void;
    updateCardOrder: (boardId: string, newOrder: string[]) => void;
    deleteList: (boardId: string, listId: string) => void;
    createList: (boardId: string, title: string, description: string, position: number) => void;
    updateList: (boardId: string, listId: string, data: Partial<BoardList>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const [storedQueue, setStoredQueue] = useLocalStorage<Action[]>('actionQueue', []);
    const [storedBoards, setStoredBoards] = useLocalStorage<Board[]>('boards', []);
    const [storedLists, setStoredLists] = useLocalStorage<BoardList[]>('lists', []);
    const [storedCards, setStoredCards] = useLocalStorage<BoardCard[]>('cards', []);
    const [tempIdMap, setTempIdMap] = useLocalStorage<{ [key: string]: string }>('tempIdMap', {});
    
    const [state, dispatch] = useReducer(rootReducer, {
        ...initialState,
        actionQueue: storedQueue,
        boards: storedBoards,
        lists: storedLists,
        cards: storedCards,
        tempIdMap,
    });
    
    const { postMessage, lastMessage: workerLastMessage, isWorkerReady } = useWebWorker();
    const { authUser } = useAuth();
    const [currentOrganizationId] = useLocalStorage<string | null>('currentOrganizationId', null);

    useEffect(() => {
        setStoredQueue(state.actionQueue);
        setStoredBoards(state.boards);
        setStoredLists(state.lists);
        setStoredCards(state.cards);
        setTempIdMap(state.tempIdMap);
    }, [state.actionQueue, state.boards, state.lists, state.cards, state.tempIdMap, setStoredQueue, setStoredBoards, setStoredLists, setStoredCards, setTempIdMap]);

    const dispatchAction = useCallback((action: Action) => {
        dispatch({ type: 'ADD_ACTION', payload: action });
    }, []);

    const setIsEditing = useCallback((isEditing: boolean) => {
        dispatch({ type: 'SET_STATE', payload: { isEditing } });
    }, []);

    const createBoard = useCallback((title: string, description: string) => {
        const timestamp = Date.now();
        const tempId = `temp_${timestamp}`;
        const newBoard: Board = {
            id: tempId, title, description, createdAt: new Date(timestamp), updatedAt: new Date(timestamp),
            ownerId: authUser?.uid || '', organizationId: currentOrganizationId || '',
        };
        dispatchAction({
            type: 'create-board',
            payload: { data: newBoard, tempId },
            timestamp,
        });
    }, [dispatchAction, authUser, currentOrganizationId]);

    const deleteBoard = useCallback((boardId: string) => {
        dispatchAction({ type: 'delete-board', payload: { boardId }, timestamp: Date.now() });
    }, [dispatchAction]);
    
    const updateBoard = useCallback((boardId: string, data: Partial<Board>) => {
        dispatchAction({ type: 'update-board', payload: { boardId, data }, timestamp: Date.now() });
    }, [dispatchAction]);

    const createCard = useCallback((listId: string, boardId: string, title: string, description: string, priority: number) => {
        const timestamp = Date.now();
        const tempId = `temp-${timestamp}`;
        const newCard: BoardCard = {
            id: tempId, title, description, listId, boardId, createdAt: new Date(timestamp), updatedAt: new Date(timestamp), priority,
            completed: false, ownerId: authUser?.uid || '', userId: authUser?.uid || '',
        };
        dispatchAction({
            type: 'create-card',
            payload: { boardId, listId, data: newCard, tempId },
            timestamp,
        });
    }, [dispatchAction, authUser]);

    const updateCard = useCallback((boardId: string, cardId: string, data: Partial<BoardCard>) => {
        dispatchAction({ type: 'update-card', payload: { boardId, cardId, data }, timestamp: Date.now() });
    }, [dispatchAction]);

    const deleteCard = useCallback((boardId: string, cardId: string) => {
        dispatchAction({ type: 'delete-card', payload: { boardId, cardId }, timestamp: Date.now() });
    }, [dispatchAction]);

    const softDeleteCard = useCallback((boardId: string, cardId: string) => {
        dispatchAction({ type: 'soft-delete-card', payload: { boardId, cardId }, timestamp: Date.now() });
    }, [dispatchAction]);

    const restoreCard = useCallback((boardId: string, cardId: string) => {
        dispatchAction({ type: 'restore-card', payload: { boardId, cardId }, timestamp: Date.now() });
    }, [dispatchAction]);

    const updateCardOrder = useCallback((boardId: string, newOrder: string[]) => {
        for (const [index, cardId] of newOrder.entries()) {
            updateCard(boardId, cardId, { priority: index });
        }
    }, [updateCard]);

    const deleteList = useCallback((boardId: string, listId: string) => {
        dispatchAction({ type: 'delete-list', payload: { boardId, listId }, timestamp: Date.now() });
    }, [dispatchAction]);

    const createList = useCallback((boardId: string, title: string, description: string, position: number) => {
        const timestamp = Date.now();
        const tempId = `temp_${timestamp}`;
        const newList: Omit<BoardList, 'id'> = {
            title, description, boardId, position, createdAt: new Date(timestamp), updatedAt: new Date(timestamp),
        };
        dispatchAction({
            type: 'create-list',
            payload: { data: { ...newList, id: tempId }, tempId },
            timestamp,
        });
    }, [dispatchAction]);

    const updateList = useCallback((boardId: string, listId: string, data: Partial<BoardList>) => {
        dispatchAction({ type: 'update-list', payload: { boardId, listId, data }, timestamp: Date.now() });
    }, [dispatchAction]);

    // Effect to process the next action in the queue
    useEffect(() => {
        const { actionQueue, isSyncing, isEditing } = state;
        if (actionQueue.length > 0 && !isSyncing && !isEditing && navigator.onLine && isWorkerReady && authUser) {
            const processNextAction = async () => {
                dispatch({ type: 'START_SYNC' });
                const actionToProcess = actionQueue[0];
                const idToken = await authUser.getIdToken();
                const orgId = currentOrganizationId;
                const payload = { ...actionToProcess.payload, idToken, orgId };
                postMessage({ ...actionToProcess, payload });
            };
            processNextAction();
        }
    }, [state.actionQueue, state.isSyncing, state.isEditing, isWorkerReady, authUser, currentOrganizationId, postMessage]);

    // Effect to handle messages from the worker
    useEffect(() => {
        if (!workerLastMessage) return;
        dispatch({ type: 'SET_LAST_MESSAGE', payload: { lastMessage: workerLastMessage } });
    }, [workerLastMessage, dispatch]); // state is not needed here because the reducer will handle the state update

    return (
        <DataContext.Provider
            value={{ ...state, setIsEditing, createBoard, updateBoard, deleteBoard, createCard, updateCard, deleteCard, softDeleteCard, restoreCard, updateCardOrder, deleteList, createList, updateList }}
        >
            {children}
        </DataContext.Provider>
    );
}

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};