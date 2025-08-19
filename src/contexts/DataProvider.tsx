/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, {
    createContext,
    useCallback,
    ReactNode,
    useContext,
    useReducer,
    useEffect,
} from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Action } from '@/types/sync.type';
import { dataReducer } from './reducers';
import {
    createBoardHelper,
    updateBoardHelper,
    deleteBoardHelper,
} from './helpers/boardHelpers';
import {
    createCardHelper,
    updateCardHelper,
    deleteCardHelper,
    softDeleteCardHelper,
    restoreCardHelper,
    updateCardOrderHelper,
} from './helpers/cardHelpers';
import {
    createListHelper,
    updateListHelper,
    deleteListHelper,
} from './helpers/listHelpers';
import { DataState } from '@/types/reducer.type';
import { Board, BoardCard, BoardList } from '@/types/appState.type';
import { useOrganizations } from './OrganizationsProvider';
import { mockBoards, mockLists, mockCards } from '@/mock/mockData';

const initialState: DataState = {
    tempIdMap: {},
    isSyncing: false,
    isEditing: false,
    actionQueue: [],
    boards: [],
    lists: [],
    cards: [],
    lastMessage: null,
    timestamp: 0,
};

const useMockToggle = process.env.NEXT_PUBLIC_USE_LOCAL_DATA === 'true';

interface DataContextType extends DataState {
    setIsEditing: (editing: boolean) => void;
    createBoard: (title: string, description: string) => void;
    updateBoard: (boardId: string, data: Partial<Board>) => void;
    deleteBoard: (boardId: string) => void;
    queueCreateBoard: (data: Partial<Board>) => void;
    queueUpdateBoard: (boardId: string, data: Partial<Board>) => void;
    createCard: (
        listId: string,
        boardId: string,
        title: string,
        description: string,
        priority: number
    ) => void;
    updateCard: (
        boardId: string,
        cardId: string,
        data: Partial<BoardCard>
    ) => void;
    deleteCard: (boardId: string, cardId: string) => void;
    softDeleteCard: (boardId: string, cardId: string) => void;
    restoreCard: (boardId: string, cardId: string) => void;
    updateCardOrder: (
        boardId: string,
        listId: string,
        cardOrder: string[]
    ) => void;
    queueCreateCard: (boardId: string, data: Partial<BoardCard>) => void;
    queueUpdateCard: (
        boardId: string,
        cardId: string,
        data: Partial<BoardCard>
    ) => void;
    createList: (
        boardId: string,
        title: string,
        description: string,
        position: number
    ) => void;
    updateList: (
        boardId: string,
        listId: string,
        data: Partial<BoardList>
    ) => void;
    deleteList: (boardId: string, listId: string) => void;
    queueCreateList: (boardId: string, data: Partial<BoardList>) => void;
    queueUpdateList: (
        boardId: string,
        listId: string,
        data: Partial<BoardList>
    ) => void;
    queueDeleteCard: (boardId: string, cardId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    // Persist actionQueue in localStorage
    const [persistedQueue, setPersistedQueue] = useLocalStorage<Action[]>('actionQueue', []);
    const [state, dispatchAction] = useReducer(dataReducer, {
        ...initialState,
        actionQueue: persistedQueue,
    });
    const { currentOrganizationId } = useOrganizations();

    useEffect(() => {
        if (useMockToggle) {
            dispatchAction({
                type: 'set-mock-data',
                payload: {
                    boards: mockBoards,
                    lists: mockLists,
                    cards: mockCards,
                },
            });
        }
    }, []);

    // Sync reducer's actionQueue to localStorage whenever it changes
    useEffect(() => {
        setPersistedQueue(state.actionQueue);
    }, [state.actionQueue, setPersistedQueue]);

    // Board actions
    // Queued Board actions
    const queueCreateBoard = useCallback(
        (data: Partial<Board>) => {
            const tempId = data.id || Math.random().toString(36).slice(2);
            dispatchAction({
                type: 'ADD_ACTION',
                payload: {
                    type: 'create-board',
                    payload: { data: { ...data, id: tempId }, tempId },
                    timestamp: Date.now(),
                },
            });
        },
        [dispatchAction]
    );

    const queueUpdateBoard = useCallback(
        (boardId: string, data: Partial<Board>) => {
            dispatchAction({
                type: 'ADD_ACTION',
                payload: {
                    type: 'update-board',
                    payload: { boardId, data },
                    timestamp: Date.now(),
                },
            });
        },
        [dispatchAction]
    );
    const createBoard = useCallback(
        (title: string, description: string) => {
            const organizationId = currentOrganizationId || '';
            const newBoard = createBoardHelper(
                title,
                description,
                organizationId
            );
            dispatchAction({
                type: 'create-board',
                payload: { data: newBoard, tempId: newBoard.id },
            });
        },
        [dispatchAction, currentOrganizationId]
    );

    const updateBoard = useCallback(
        (boardId: string, data: Partial<Board>) => {
            dispatchAction(updateBoardHelper(boardId, data));
        },
        [dispatchAction]
    );

    const deleteBoard = useCallback(
        (boardId: string) => {
            dispatchAction(deleteBoardHelper(boardId));
        },
        [dispatchAction]
    );

    // Queued Card actions
    const queueCreateCard = useCallback(
        (boardId: string, data: Partial<BoardCard>) => {
            const tempId = data.id || Math.random().toString(36).slice(2);
            dispatchAction({
                type: 'ADD_ACTION',
                payload: {
                    type: 'create-card',
                    payload: { boardId, data: { ...data, id: tempId }, tempId },
                    timestamp: Date.now(),
                },
            });
        },
        [dispatchAction]
    );

    const queueUpdateCard = useCallback(
        (boardId: string, cardId: string, data: Partial<BoardCard>) => {
            dispatchAction({
                type: 'ADD_ACTION',
                payload: {
                    type: 'update-card',
                    payload: { boardId, cardId, data },
                    timestamp: Date.now(),
                },
            });
        },
        [dispatchAction]
    );
    const createCard = useCallback(
        (
            listId: string,
            boardId: string,
            title: string,
            description: string,
            priority: number
        ) => {
            const newCard = createCardHelper(
                listId,
                title,
                description,
                priority
            );
            dispatchAction({
                type: 'create-card',
                payload: { boardId, listId, data: newCard, tempId: newCard.id },
            });
        },
        [dispatchAction]
    );

    const updateCard = useCallback(
        (boardId: string, cardId: string, data: Partial<BoardCard>) => {
            dispatchAction(updateCardHelper(boardId, cardId, data));
        },
        [dispatchAction]
    );

    const deleteCard = useCallback(
        (boardId: string, cardId: string) => {
            dispatchAction(deleteCardHelper(boardId, cardId));
        },
        [dispatchAction]
    );

    const softDeleteCard = useCallback(
        (boardId: string, cardId: string) => {
            dispatchAction(softDeleteCardHelper(boardId, cardId));
        },
        [dispatchAction]
    );

    const restoreCard = useCallback(
        (boardId: string, cardId: string) => {
            dispatchAction(restoreCardHelper(boardId, cardId));
        },
        [dispatchAction]
    );

    const updateCardOrder = useCallback(
        (boardId: string, listId: string, cardOrder: string[]) => {
            dispatchAction(updateCardOrderHelper(boardId, listId, cardOrder));
        },
        [dispatchAction]
    );

    // Queued List actions
    const queueCreateList = useCallback(
        (boardId: string, data: Partial<BoardList>) => {
            const tempId = data.id || Math.random().toString(36).slice(2);
            dispatchAction({
                type: 'ADD_ACTION',
                payload: {
                    type: 'create-list',
                    payload: { boardId, data: { ...data, id: tempId }, tempId },
                    timestamp: Date.now(),
                },
            });
        },
        [dispatchAction]
    );

    const queueUpdateList = useCallback(
        (boardId: string, listId: string, data: Partial<BoardList>) => {
            dispatchAction({
                type: 'ADD_ACTION',
                payload: {
                    type: 'update-list',
                    payload: { boardId, listId, data },
                    timestamp: Date.now(),
                },
            });
        },
        [dispatchAction]
    );
    const createList = useCallback(
        (
            boardId: string,
            title: string,
            description: string,
            position: number
        ) => {
            const newList = createListHelper(title, description, position);
            dispatchAction({
                type: 'create-list',
                payload: { boardId, data: newList, tempId: newList.id },
            });
        },
        [dispatchAction]
    );

    const updateList = useCallback(
        (boardId: string, listId: string, data: Partial<BoardList>) => {
            dispatchAction(updateListHelper(boardId, listId, data));
        },
        [dispatchAction]
    );

    const deleteList = useCallback(
        (boardId: string, listId: string) => {
            dispatchAction(deleteListHelper(boardId, listId));
        },
        [dispatchAction]
    );

    // Add setIsEditing function
    const setIsEditing = useCallback(
        (editing: boolean) => {
            dispatchAction({
                type: 'set-is-editing',
                payload: { isEditing: editing },
            });
        },
        [dispatchAction]
    );

    const queueDeleteCard = useCallback(
        (boardId: string, cardId: string) => {
            dispatchAction({
                type: 'ADD_ACTION',
                payload: {
                    type: 'delete-card',
                    payload: { boardId, cardId },
                    timestamp: Date.now(),
                },
            });
        },
        [dispatchAction]
    );

    const contextValue: DataContextType = {
        ...state,
        setIsEditing,
        createBoard,
        updateBoard,
        deleteBoard,
        queueCreateBoard,
        queueUpdateBoard,
        createCard,
        updateCard,
        deleteCard,
        softDeleteCard,
        restoreCard,
        updateCardOrder,
        queueCreateCard,
        queueUpdateCard,
        createList,
        updateList,
        deleteList,
        queueCreateList,
        queueUpdateList,
        queueDeleteCard,
    };

    return (
        <DataContext.Provider value={contextValue}>
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
