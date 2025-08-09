'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import { Board, List, BoardCard } from '../types/appState.type';

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
  const [boards] = useLocalStorage<Board[]>('boards', []);
  const [lists] = useLocalStorage<List[]>('lists', []);
  const [cards] = useLocalStorage<BoardCard[]>('cards', []);

  const contextValue: BoardDataContextType = {
    boards,
    lists,
    cards,
  };

  return (
    <BoardDataContext.Provider value={contextValue}>
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
