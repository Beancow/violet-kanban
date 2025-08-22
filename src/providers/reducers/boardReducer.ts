import { Draft, produce } from 'immer';
import type { Board } from '../../types/appState.type';

export type BoardState = {
    boards: Board[];
};

type Action =
    | { type: 'ADD_BOARD'; board: Board }
    | { type: 'UPDATE_BOARD'; board: Partial<Board> & { id: string } }
    | { type: 'REMOVE_BOARD'; boardId: string }
    | { type: 'SET_BOARDS'; boards: Board[] };

export function reducer(state: BoardState, action: Action): BoardState {
    return produce(state, (draft: Draft<BoardState>) => {
        switch (action.type) {
            case 'ADD_BOARD':
                draft.boards.push(action.board);
                return;
            case 'UPDATE_BOARD': {
                const idx = draft.boards.findIndex(
                    (b) => b.id === action.board.id
                );
                if (idx >= 0) {
                    draft.boards[idx] = {
                        ...draft.boards[idx],
                        ...action.board,
                    } as Board;
                }
                return;
            }
            case 'REMOVE_BOARD':
                draft.boards = draft.boards.filter(
                    (b) => b.id !== action.boardId
                );
                return;
            case 'SET_BOARDS':
                draft.boards = action.boards;
                return;
        }
    });
}

export default reducer;
