import boardReducer, {
    BoardState,
} from '../../src/providers/reducers/boardReducer';
import listReducer, {
    ListState,
} from '../../src/providers/reducers/listReducer';
import cardReducer, {
    CardState,
} from '../../src/providers/reducers/cardReducer';
import queueReducer, {
    QueueState,
} from '../../src/providers/reducers/queueReducer';
import tempIdMapReducer, {
    TempIdMapState,
} from '../../src/providers/reducers/tempIdMapReducer';

export type TestApi = {
    // boards
    addBoard: (b: any) => void;
    getBoards: () => any[];
    // lists
    addList: (l: any) => void;
    getLists: () => any[];
    // cards
    addCard: (c: any) => void;
    getCards: () => any[];
    // queue
    enqueueBoardAction: (a: any) => void;
    enqueueListAction: (a: any) => void;
    enqueueCardAction: (a: any) => void;
    removeBoardAction: (id: string) => void;
    removeListAction: (id: string) => void;
    removeCardAction: (id: string) => void;
    getQueue: () => any[];
    // temp id map
    setMapping: (tempId: string, realId: string) => void;
    getRealId: (tempId: string) => string | undefined;
    getTempMap: () => Record<string, string>;
};

// TestConsumer optionally accepts an onReady callback. If provided it will be
// called with the test API; if not, it will fall back to populating
// global.__testApi for backwards compatibility.
export function TestConsumer({
    onReady,
}: {
    onReady?: (api: TestApi) => void;
}) {
    // synchronous reducer-backed test harness (no React rendering)
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

    const api: TestApi = {
        addBoard: (b: any) => dispatchBoard({ type: 'ADD_BOARD', board: b }),
        getBoards: () => boardState.boards,
        addList: (l: any) => dispatchList({ type: 'ADD_LIST', list: l }),
        getLists: () => listState.lists,
        addCard: (c: any) => dispatchCard({ type: 'ADD_CARD', card: c }),
        getCards: () => cardState.cards,
        enqueueBoardAction: (a: any) =>
            dispatchQueue({ type: 'ENQUEUE_BOARD', action: a }),
        enqueueListAction: (a: any) =>
            dispatchQueue({ type: 'ENQUEUE_LIST', action: a }),
        enqueueCardAction: (a: any) =>
            dispatchQueue({ type: 'ENQUEUE_CARD', action: a }),
        removeBoardAction: (id: string) => {
            // find queued action matching temp id
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
                const tempId = (action.payload &&
                    (action.payload.tempId || action.payload.data?.tempId)) as
                    | string
                    | undefined;
                const realId = tempId ? tempMapState[tempId] : undefined;
                const newBoard = {
                    ...(action.payload?.data || {}),
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
                const tempId = (action.payload &&
                    (action.payload.tempId || action.payload.data?.tempId)) as
                    | string
                    | undefined;
                const realId = tempId ? tempMapState[tempId] : undefined;
                const newList = {
                    ...(action.payload?.data || {}),
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
                const tempId = (action.payload &&
                    (action.payload.tempId || action.payload.data?.tempId)) as
                    | string
                    | undefined;
                const realId = tempId ? tempMapState[tempId] : undefined;
                const newCard = {
                    ...(action.payload?.data || {}),
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

    if (typeof onReady === 'function') {
        onReady(api);
    } else {
        // backward compatibility
        // @ts-ignore
        (global as any).__testApi = api;
    }

    return null;
}

// Mounts AppProvider + TestConsumer and returns the test API and an unmount helper.
export function mountAppWithTestApi() {
    let api: TestApi | undefined;

    // initialize synchronous harness and return API
    TestConsumer({ onReady: (a) => (api = a) });

    if (!api) throw new Error('Test API not initialized');

    return {
        api,
        unmount: () => {
            /* no-op for synchronous harness */
        },
        renderer: null,
    };
}

export default TestConsumer;
