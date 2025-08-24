import boardReducer, { BoardState } from '@/providers/reducers/boardReducer';
import listReducer, { ListState } from '@/providers/reducers/listReducer';
import cardReducer, { CardState } from '@/providers/reducers/cardReducer';
import queueReducer, { QueueState } from '@/providers/reducers/queueReducer';
import tempIdMapReducer, {
    TempIdMapState,
} from '@/providers/reducers/tempIdMapReducer';
import type { Board, BoardList, BoardCard } from '@/types/appState.type';
import type { VioletKanbanAction } from '@/types/violet-kanban-action';

export type ReducerHarness = {
    boardState: BoardState;
    listState: ListState;
    cardState: CardState;
    queueState: QueueState;
    tempMapState: TempIdMapState;

    addBoard: (b: Board) => void;
    getBoards: () => Board[];
    addList: (l: BoardList) => void;
    getLists: () => BoardList[];
    addCard: (c: BoardCard) => void;
    getCards: () => BoardCard[];
    enqueueBoardAction: (a: VioletKanbanAction) => void;
    enqueueListAction: (a: VioletKanbanAction) => void;
    enqueueCardAction: (a: VioletKanbanAction) => void;
    removeBoardAction: (id: string) => void;
    removeListAction: (id: string) => void;
    removeCardAction: (id: string) => void;
    getQueue: () => VioletKanbanAction[];
    setMapping: (tempId: string, realId: string) => void;
    getRealId: (tempId: string) => string | undefined;
    getTempMap: () => Record<string, string>;
};

export function createReducerHarness(): ReducerHarness {
    let boardState: BoardState = { boards: [] };
    let listState: ListState = { lists: [] };
    let cardState: CardState = { cards: [] };
    let queueState: QueueState = {
        boardActionQueue: [],
        listActionQueue: [],
        cardActionQueue: [],
    };
    let tempMapState: TempIdMapState = {};

    const dispatchBoard = (action: any) => {
        boardState = (boardReducer as any)(boardState, action);
    };
    const dispatchList = (action: any) => {
        listState = (listReducer as any)(listState, action);
    };
    const dispatchCard = (action: any) => {
        cardState = (cardReducer as any)(cardState, action);
    };
    const dispatchQueue = (action: any) => {
        queueState = (queueReducer as any)(queueState, action);
    };
    const dispatchTempMap = (action: any) => {
        tempMapState = (tempIdMapReducer as any)(tempMapState, action);
    };

    const api: ReducerHarness = {
        boardState,
        listState,
        cardState,
        queueState,
        tempMapState,
        addBoard: (b: Board) => dispatchBoard({ type: 'ADD_BOARD', board: b }),
        getBoards: () => boardState.boards,
        addList: (l: BoardList) => dispatchList({ type: 'ADD_LIST', list: l }),
        getLists: () => listState.lists,
        addCard: (c: BoardCard) => dispatchCard({ type: 'ADD_CARD', card: c }),
        getCards: () => cardState.cards,
        enqueueBoardAction: (a: VioletKanbanAction) =>
            dispatchQueue({ type: 'ENQUEUE_BOARD', action: a }),
        enqueueListAction: (a: VioletKanbanAction) =>
            dispatchQueue({ type: 'ENQUEUE_LIST', action: a }),
        enqueueCardAction: (a: VioletKanbanAction) =>
            dispatchQueue({ type: 'ENQUEUE_CARD', action: a }),
        removeBoardAction: (id: string) => {
            // reconcile create actions: add board if mapped and not present
            const idx = queueState.boardActionQueue.findIndex((a: any) => {
                const p = a.payload as any;
                return (
                    (p &&
                        (p.tempId === id ||
                            (p.data && p.data.tempId === id))) ||
                    false
                );
            });
            const action =
                idx >= 0 ? queueState.boardActionQueue[idx] : undefined;
            if (action && /create/i.test(action.type)) {
                const payload = (action.payload as any) || {};
                const tempId = (payload.tempId || payload.data?.tempId) as
                    | string
                    | undefined;
                const realId = tempId ? tempMapState[tempId] : undefined;
                const newBoard = {
                    ...(payload.data || {}),
                    id: realId,
                } as any;
                if (realId) {
                    const exists = boardState.boards.find(
                        (b) => b.id === realId
                    );
                    if (!exists)
                        dispatchBoard({ type: 'ADD_BOARD', board: newBoard });
                }
            }
            dispatchQueue({ type: 'REMOVE_BOARD_BY_ID', itemId: id });
        },
        removeListAction: (id: string) => {
            const idx = queueState.listActionQueue.findIndex((a: any) => {
                const p = a.payload as any;
                return (
                    (p &&
                        (p.tempId === id ||
                            (p.data && p.data.tempId === id))) ||
                    false
                );
            });
            const action =
                idx >= 0 ? queueState.listActionQueue[idx] : undefined;
            if (action && /create/i.test(action.type)) {
                const payload = (action.payload as any) || {};
                const tempId = (payload.tempId || payload.data?.tempId) as
                    | string
                    | undefined;
                const realId = tempId ? tempMapState[tempId] : undefined;
                const newList = {
                    ...(payload.data || {}),
                    id: realId,
                } as any;
                if (realId) {
                    const exists = listState.lists.find((l) => l.id === realId);
                    if (!exists)
                        dispatchList({ type: 'ADD_LIST', list: newList });
                }
            }
            dispatchQueue({ type: 'REMOVE_LIST_BY_ID', itemId: id });
        },
        removeCardAction: (id: string) => {
            const idx = queueState.cardActionQueue.findIndex((a: any) => {
                const p = a.payload as any;
                return (
                    (p &&
                        (p.tempId === id ||
                            (p.data && p.data.tempId === id))) ||
                    false
                );
            });
            const action =
                idx >= 0 ? queueState.cardActionQueue[idx] : undefined;
            if (action && /create/i.test(action.type)) {
                const payload = (action.payload as any) || {};
                const tempId = (payload.tempId || payload.data?.tempId) as
                    | string
                    | undefined;
                const realId = tempId ? tempMapState[tempId] : undefined;
                const newCard = {
                    ...(payload.data || {}),
                    id: realId,
                } as any;
                if (realId) {
                    const exists = cardState.cards.find((c) => c.id === realId);
                    if (!exists)
                        dispatchCard({ type: 'ADD_CARD', card: newCard });
                }
            }
            dispatchQueue({ type: 'REMOVE_CARD_BY_ID', itemId: id });
        },
        getQueue: () => [
            ...queueState.boardActionQueue,
            ...queueState.listActionQueue,
            ...queueState.cardActionQueue,
        ],
        setMapping: (tempId: string, realId: string) =>
            dispatchTempMap({ type: 'SET_MAPPING', tempId, realId }),
        getRealId: (tempId: string) => tempMapState[tempId],
        getTempMap: () => tempMapState,
    };

    return api;
}
