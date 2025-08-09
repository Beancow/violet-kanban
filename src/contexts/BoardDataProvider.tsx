
'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Board, List, BoardCard, Action } from '../types/appState.type';

interface BoardDataContextType {
  boards: Board[];
  lists: List[];
  cards: BoardCard[];
}

const BoardDataContext = createContext<BoardDataContextType | undefined>(undefined);

interface BoardDataProviderProps {
  children: ReactNode;
}

export const BoardDataProvider: React.FC<BoardDataProviderProps> = ({ children }) => {
  const [baseBoards] = useLocalStorage<Board[]>('boards', []);
  const [baseLists] = useLocalStorage<List[]>('lists', []);
  const [baseCards] = useLocalStorage<BoardCard[]>('cards', []);
  const [actionQueue] = useLocalStorage<Action[]>('actionQueue', []);

  const mergedData = useMemo(() => {
    const boards = [...baseBoards];
    const lists = [...baseLists];
    const cards = [...baseCards];

    actionQueue.forEach(action => {
        switch (action.type) {
            case 'create-board':
                boards.push(action.payload.data);
                break;
            case 'updateBoard':
                const boardIndex = boards.findIndex(b => b.id === action.payload.boardId);
                if (boardIndex !== -1) {
                    boards[boardIndex] = { ...boards[boardIndex], ...action.payload.data };
                }
                break;
            case 'deleteBoard':
                // Note: This is a simple removal. Cascading deletes are handled by the server action.
                const boardToDeleteIndex = boards.findIndex(b => b.id === action.payload.boardId);
                if (boardToDeleteIndex !== -1) {
                    boards.splice(boardToDeleteIndex, 1);
                }
                break;
            case 'create-list':
                lists.push(action.payload.data);
                break;
            case 'updateList':
                const listIndex = lists.findIndex(l => l.id === action.payload.listId);
                if (listIndex !== -1) {
                    lists[listIndex] = { ...lists[listIndex], ...action.payload.data };
                }
                break;
            case 'deleteList':
                const listToDeleteIndex = lists.findIndex(l => l.id === action.payload.listId);
                if (listToDeleteIndex !== -1) {
                    lists.splice(listToDeleteIndex, 1);
                }
                break;
            case 'addCard':
                cards.push(action.payload.newCard);
                break;
            case 'updateCard':
                const cardIndex = cards.findIndex(c => c.id === action.payload.cardId);
                if (cardIndex !== -1) {
                    cards[cardIndex] = { ...cards[cardIndex], ...action.payload.data };
                }
                break;
            case 'softDeleteCard':
                const cardToSoftDeleteIndex = cards.findIndex(c => c.id === action.payload.cardId);
                if (cardToSoftDeleteIndex !== -1) {
                    cards[cardToSoftDeleteIndex].deleted = true;
                }
                break;
            case 'restoreCard':
                const cardToRestoreIndex = cards.findIndex(c => c.id === action.payload.cardId);
                if (cardToRestoreIndex !== -1) {
                    cards[cardToRestoreIndex].deleted = false;
                }
                break;
        }
    });

    return { boards, lists, cards };
  }, [baseBoards, baseLists, baseCards, actionQueue]);

  return (
    <BoardDataContext.Provider value={mergedData}>
      {children}
    </BoardDataContext.Provider>
  );
};

export const useBoardData = () => {
  const context = useContext(BoardDataContext);
  if (context === undefined) {
    throw new Error('useBoardData must be used within a BoardDataProvider');
  }
  return context;
};
