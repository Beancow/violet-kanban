import { Action, ActionPayload } from '@/types/sync.type';
import { Board, BoardList, BoardCard } from '@/types/appState.type';
import { DataState, ReducerAction } from '@/types/reducer.type';

function boardsReducer(state: Board[], action: Action): Board[] {
    switch (action.type) {
        case 'create-board':
            return [...state, (action.payload as { data: Board }).data];
        case 'delete-board':
            return state.filter(
                (b) => b.id !== (action.payload as { boardId: string }).boardId
            );
        case 'update-board':
            return state.map((b) =>
                b.id === (action.payload as { boardId: string }).boardId
                    ? {
                          ...b,
                          ...(action.payload as { data: Partial<Board> }).data,
                      }
                    : b
            );
        default:
            return state;
    }
}

function listsReducer(state: BoardList[], action: Action): BoardList[] {
    switch (action.type) {
        case 'create-list':
            return [...state, (action.payload as { data: BoardList }).data];
        case 'delete-list':
            return state.filter(
                (l) => l.id !== (action.payload as { listId: string }).listId
            );
        case 'update-list':
            return state.map((l) =>
                l.id === (action.payload as { listId: string }).listId
                    ? {
                          ...l,
                          ...(action.payload as { data: Partial<BoardList> })
                              .data,
                      }
                    : l
            );
        default:
            return state;
    }
}

function cardsReducer(state: BoardCard[], action: Action): BoardCard[] {
    switch (action.type) {
        case 'create-card':
            return [...state, (action.payload as { data: BoardCard }).data];
        case 'delete-card':
            return state.filter(
                (c) => c.id !== (action.payload as { cardId: string }).cardId
            );
        case 'soft-delete-card':
            return state.map((c) =>
                c.id === (action.payload as { cardId: string }).cardId
                    ? { ...c, isDeleted: true }
                    : c
            );
        case 'update-card':
            return state.map((c) =>
                c.id === (action.payload as { cardId: string }).cardId
                    ? {
                          ...c,
                          ...(action.payload as { data: Partial<BoardCard> })
                              .data,
                      }
                    : c
            );
        case 'restore-card':
            return state.map((c) =>
                c.id === (action.payload as { cardId: string }).cardId
                    ? { ...c, isDeleted: false }
                    : c
            );
        default:
            return state;
    }
}

export function rootReducer(
    state: DataState,
    action: ReducerAction
): DataState {
    switch (action.type) {
        case 'SET_STATE':
            return { ...state, ...action.payload };
        case 'ADD_ACTION': {
            if (
                state.actionQueue.some(
                    (a) => a.timestamp === action.payload.timestamp
                )
            ) {
                return state;
            }
            const newAction = action.payload;
            return {
                ...state,
                actionQueue: [...state.actionQueue, newAction],
                boards: boardsReducer(state.boards, newAction),
                lists: listsReducer(state.lists, newAction),
                cards: cardsReducer(state.cards, newAction),
            };
        }
        case 'START_SYNC':
            return { ...state, isSyncing: true };
        case 'ACTION_COMPLETE': {
            const { timestamp } = action.payload;
            const newQueue = state.actionQueue.filter(
                (a) => a.timestamp !== timestamp
            );
            return {
                ...state,
                isSyncing: newQueue.length > 0,
                actionQueue: newQueue,
            };
        }
        case 'SET_LAST_MESSAGE': {
            const { lastMessage } = action.payload;
            if (!lastMessage) return state;

            const newState = { ...state, lastMessage };

            switch (lastMessage.type) {
                case 'ACTION_SUCCESS': {
                    const { timestamp, tempId, board, list, card } =
                        lastMessage.payload;

                    if (tempId && board) {
                        const newMap = {
                            ...state.tempIdMap,
                            [tempId]: board.id,
                        };
                        newState.tempIdMap = newMap;
                        newState.boards = state.boards.map((b) =>
                            b.id === tempId ? board : b
                        );
                        newState.actionQueue = state.actionQueue.map((act) => {
                            if (
                                (act.payload as { boardId: string }).boardId ===
                                tempId
                            ) {
                                return {
                                    ...act,
                                    payload: {
                                        ...(act.payload as ActionPayload),
                                        boardId: board.id,
                                    },
                                };
                            }
                            return act;
                        });
                    } else if (tempId && list) {
                        const newMap = {
                            ...state.tempIdMap,
                            [tempId]: list.id,
                        };
                        newState.tempIdMap = newMap;
                        newState.lists = state.lists.map((l) =>
                            l.id === tempId ? list : l
                        );
                        newState.actionQueue = state.actionQueue.map((act) => {
                            if (
                                (act.payload as { listId: string }).listId ===
                                tempId
                            ) {
                                return {
                                    ...act,
                                    payload: {
                                        ...(act.payload as ActionPayload),
                                        listId: list.id,
                                    },
                                };
                            }
                            return act;
                        });
                    } else if (tempId && card) {
                        const newMap = {
                            ...state.tempIdMap,
                            [tempId]: card.id,
                        };
                        newState.tempIdMap = newMap;
                        newState.cards = state.cards.map((c) =>
                            c.id === tempId ? card : c
                        );
                        newState.actionQueue = state.actionQueue.map((act) => {
                            if (
                                (act.payload as { cardId: string }).cardId ===
                                tempId
                            ) {
                                return {
                                    ...act,
                                    payload: {
                                        ...(act.payload as ActionPayload),
                                        cardId: card.id,
                                    },
                                };
                            }
                            return act;
                        });
                    }

                    newState.actionQueue = newState.actionQueue.filter(
                        (a) => a.timestamp !== timestamp
                    );
                    newState.isSyncing = newState.actionQueue.length > 0;
                    break;
                }
                case 'ERROR': {
                    const timestamp = lastMessage.payload?.timestamp;
                    if (timestamp) {
                        newState.actionQueue = state.actionQueue.filter(
                            (a) => a.timestamp !== timestamp
                        );
                    }
                    newState.isSyncing = newState.actionQueue.length > 0;
                    break;
                }
                case 'FULL_DATA_RECEIVED':
                    newState.boards = lastMessage.payload.boards || [];
                    newState.lists = lastMessage.payload.lists || [];
                    newState.cards = lastMessage.payload.cards || [];
                    break;
            }
            return newState;
        }
        default:
            return state;
    }
}

export function dataReducer(state: DataState, action: any): DataState {
    switch (action.type) {
        case 'set-is-editing':
            return { ...state, isEditing: action.payload.isEditing };
        case 'SET_STATE':
            return { ...state, ...action.payload };
        case 'ADD_ACTION': {
            if (
                state.actionQueue.some(
                    (a) => a.timestamp === action.payload.timestamp
                )
            ) {
                return state;
            }
            const newAction = action.payload;
            return {
                ...state,
                actionQueue: [...state.actionQueue, newAction],
                boards: boardsReducer(state.boards, newAction),
                lists: listsReducer(state.lists, newAction),
                cards: cardsReducer(state.cards, newAction),
            };
        }
        case 'START_SYNC':
            return { ...state, isSyncing: true };
        case 'ACTION_COMPLETE': {
            const { timestamp } = action.payload;
            const newQueue = state.actionQueue.filter(
                (a) => a.timestamp !== timestamp
            );
            return {
                ...state,
                isSyncing: newQueue.length > 0,
                actionQueue: newQueue,
            };
        }
        case 'SET_LAST_MESSAGE': {
            const { lastMessage } = action.payload;
            if (!lastMessage) return state;

            const newState = { ...state, lastMessage };

            switch (lastMessage.type) {
                case 'ACTION_SUCCESS': {
                    const { timestamp, tempId, board, list } =
                        lastMessage.payload;

                    if (tempId && board) {
                        const newMap = {
                            ...state.tempIdMap,
                            [tempId]: board.id,
                        };
                        newState.tempIdMap = newMap;
                        newState.boards = state.boards.map((b) =>
                            b.id === tempId ? board : b
                        );
                        // Remap any subsequent actions in the queue
                        newState.actionQueue = state.actionQueue.map((act) => {
                            if (
                                (act.payload as { boardId: string }).boardId ===
                                tempId
                            ) {
                                return {
                                    ...act,
                                    payload: {
                                        ...(act.payload as ActionPayload),
                                        boardId: board.id,
                                    },
                                };
                            }
                            return act;
                        });
                    } else if (tempId && list) {
                        const newMap = {
                            ...state.tempIdMap,
                            [tempId]: list.id,
                        };
                        newState.tempIdMap = newMap;
                        newState.lists = state.lists.map((l) =>
                            l.id === tempId ? list : l
                        );
                        // Remap any subsequent actions in the queue
                        newState.actionQueue = state.actionQueue.map((act) => {
                            if (
                                (act.payload as { listId: string }).listId ===
                                tempId
                            ) {
                                return {
                                    ...act,
                                    payload: {
                                        ...(act.payload as ActionPayload),
                                        listId: list.id,
                                    },
                                };
                            }
                            return act;
                        });
                    }
                    // Add similar logic for cards if they also need to be reconciled

                    newState.actionQueue = newState.actionQueue.filter(
                        (a) => a.timestamp !== timestamp
                    );
                    newState.isSyncing = newState.actionQueue.length > 0;
                    break;
                }
                case 'ERROR': {
                    const timestamp = lastMessage.payload?.timestamp;
                    if (timestamp) {
                        newState.actionQueue = state.actionQueue.filter(
                            (a) => a.timestamp !== timestamp
                        );
                    }
                    newState.isSyncing = newState.actionQueue.length > 0;
                    break;
                }
                case 'FULL_DATA_RECEIVED':
                    newState.boards = lastMessage.payload.boards || [];
                    newState.lists = lastMessage.payload.lists || [];
                    newState.cards = lastMessage.payload.cards || [];
                    break;
            }
            return newState;
        }
        case 'set-mock-data':
            return {
                ...state,
                boards: action.payload.boards,
                lists: action.payload.lists,
                cards: action.payload.cards,
            };
        default:
            return state;
    }
}
