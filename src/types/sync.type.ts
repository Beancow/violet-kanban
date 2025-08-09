import { Board, BoardList, BoardCard } from './appState.type';

export type ActionPayload = 
    | { data: Board; tempId: string }
    | { boardId: string }
    | { boardId: string; data: Partial<Board> }
    | { data: BoardList; tempId: string }
    | { boardId: string; listId: string }
    | { boardId: string; listId: string; data: Partial<BoardList> }
    | { boardId: string; listId: string; data: BoardCard; tempId: string }
    | { boardId: string; cardId: string }
    | { boardId: string; cardId: string; data: Partial<BoardCard> };

export interface Action {
    type: string;
    payload: ActionPayload;
    timestamp: number;
}
