import type { Board, BoardList, BoardCard } from './appState.type';
import type { VioletKanbanAction } from './violet-kanban-action';

export interface QueueState {
    boardActionQueue: VioletKanbanAction[];
    listActionQueue: VioletKanbanAction[];
    cardActionQueue: VioletKanbanAction[];
    enqueueBoardAction: (action: VioletKanbanAction) => void;
    enqueueListAction: (action: VioletKanbanAction) => void;
    enqueueCardAction: (action: VioletKanbanAction) => void;
    removeBoardAction: (actionId: string) => void;
    removeListAction: (actionId: string) => void;
    removeCardAction: (actionId: string) => void;
    enqueueBoardCreateOrUpdate: (data: Board) => void;
    enqueueListCreateOrUpdate: (data: BoardList) => void;
    enqueueCardCreateOrUpdate: (data: BoardCard) => void;
    enqueueCardDelete: (id: string) => void;
    enqueueListDelete: (id: string) => void;
    enqueueBoardDelete: (id: string) => void;
    enqueueCardMove: (payload: {
        id: string;
        newIndex: number;
        listId: string;
        boardId?: string;
    }) => void;
    handleBoardActionSuccess: (
        tempId: string | undefined,
        newBoard: Board
    ) => void;
    handleListActionSuccess: (
        tempId: string | undefined,
        newList: BoardList
    ) => void;
    handleCardActionSuccess: (
        tempId: string | undefined,
        newCard: BoardCard
    ) => void;
}

export interface CardState {
    cards: BoardCard[];
    orphanedCards?: BoardCard[];
    addCard: (card: BoardCard) => void;
    updateCard: (card: Partial<BoardCard> & { id: string }) => void;
    removeCard: (cardId: string) => void;
    markCardOrphaned: (cardId: string) => void;
}

export interface TempIdMapState {
    tempIdMap: Record<string, string>;
    setMapping: (tempId: string, realId: string) => void;
    getRealId: (tempId: string) => string | undefined;
    clearMapping: (tempId: string) => void;
    clearAll: () => void;
}

export interface BoardState {
    boards: Board[];
    addBoard: (board: Board) => void;
    updateBoard: (board: Partial<Board> & { id: string }) => void;
    removeBoard: (boardId: string) => void;
}

export interface ListState {
    lists: BoardList[];
    addList: (list: BoardList) => void;
    updateList: (list: Partial<BoardList> & { id: string }) => void;
    removeList: (listId: string) => void;
}

export interface AppState {
    boards: Board[];
    lists: BoardList[];
    cards: BoardCard[];
    boardActionQueue: VioletKanbanAction[];
    listActionQueue: VioletKanbanAction[];
    cardActionQueue: VioletKanbanAction[];
    staleBoardActions?: VioletKanbanAction[];
    staleListActions?: VioletKanbanAction[];
    staleCardActions?: VioletKanbanAction[];
    orphanedCards?: BoardCard[];
    addBoard: (board: Board) => void;
    updateBoard: (board: Partial<Board> & { id: string }) => void;
    removeBoard: (boardId: string) => void;
    addList: (list: BoardList) => void;
    updateList: (list: Partial<BoardList> & { id: string }) => void;
    removeList: (listId: string) => void;
    addCard: (card: BoardCard) => void;
    updateCard: (card: Partial<BoardCard> & { id: string }) => void;
    removeCard: (cardId: string) => void;
    enqueueBoardAction: (action: VioletKanbanAction) => void;
    enqueueListAction: (action: VioletKanbanAction) => void;
    enqueueCardAction: (action: VioletKanbanAction) => void;
    dequeueBoardAction: () => void;
    dequeueListAction: () => void;
    dequeueCardAction: () => void;
    processBoardAction: (action: VioletKanbanAction) => void;
    processListAction: (action: VioletKanbanAction) => void;
    processCardAction: (action: VioletKanbanAction) => void;
    recoverOrphanedCard: (cardId: string, newBoardId: string) => void;
}

export default {};
