import { useBoards } from './BoardProvider';
import { useLists } from './ListProvider';
import { useCards } from './CardProvider';
import { useQueues } from './QueueProvider';
import { useTempIdMap } from './TempIdMapProvider';
import type { Board, BoardList, BoardCard } from '@/types/appState.type';
import type { BoardCreate, ListCreate, CardCreate } from '@/types/worker.type';
import type { VioletKanbanAction } from '@/types/violet-kanban-action';
import { isObject } from '@/types/typeGuards';

// Adapters: providers expose API objects; wrap them into convenient hooks
export function useVioletKanbanData() {
    const boardApi = useBoards();
    const listApi = useLists();
    const cardApi = useCards();
    const boards = boardApi.state.boards as Board[];
    const lists = listApi.state.lists as BoardList[];
    const cards = cardApi.state.cards as BoardCard[];
    return { boards, lists, cards };
}

export function useVioletKanbanOrphanedCards() {
    const cardApi = useCards();
    return (cardApi.state.orphanedCards as BoardCard[]) ?? [];
}

export function useVioletKanbanQueues() {
    const q = useQueues();
    return {
        boardActionQueue: q.state.boardActionQueue,
        listActionQueue: q.state.listActionQueue,
        cardActionQueue: q.state.cardActionQueue,
    };
}

export function useVioletKanbanAddBoard() {
    const b = useBoards();
    return b.addBoard;
}

export function useVioletKanbanAddList() {
    const l = useLists();
    return l.addList;
}

export function useVioletKanbanAddCard() {
    const c = useCards();
    return c.addCard;
}

export function useVioletKanbanEnqueueBoardCreateOrUpdate() {
    const q = useQueues();
    return (data: Partial<Board> | (BoardCreate & { id?: string })) => {
        const idCandidate = (data as { id?: string })?.id;
        if (
            (typeof idCandidate === 'string' &&
                idCandidate.startsWith('temp-')) ||
            !idCandidate
        ) {
            const tempId =
                (typeof idCandidate === 'string' && idCandidate) ||
                `board-temp-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`;
            const { id: _id, ...createDataRaw } = data as BoardCreate &
                Record<string, unknown>;
            const createData = {
                ...(createDataRaw as BoardCreate),
            } as BoardCreate;
            q.enqueueBoardAction({
                type: 'create-board',
                payload: { data: createData, tempId },
                timestamp: Date.now(),
            } as VioletKanbanAction);
            return;
        }
        q.enqueueBoardAction({
            type: 'update-board',
            payload: { data },
            timestamp: Date.now(),
        } as VioletKanbanAction);
    };
}

export function useVioletKanbanEnqueueListCreateOrUpdate() {
    const q = useQueues();
    return (data: Partial<BoardList> | (ListCreate & { id?: string })) => {
        const idCandidate = (data as { id?: string })?.id;
        if (
            (typeof idCandidate === 'string' &&
                idCandidate.startsWith('temp-')) ||
            !idCandidate
        ) {
            const tempId =
                (typeof idCandidate === 'string' && idCandidate) ||
                `list-temp-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`;
            const { id: _id, ...createDataRaw } = data as ListCreate &
                Record<string, unknown>;
            const createData = {
                ...(createDataRaw as ListCreate),
            } as ListCreate;
            // safely copy boardId if present on the input
            if (
                isObject(data) &&
                'boardId' in (data as Record<string, unknown>)
            ) {
                (createData as ListCreate).boardId = (
                    data as Record<string, unknown>
                ).boardId as string;
            }
            q.enqueueListAction({
                type: 'create-list',
                payload: { data: createData, tempId },
                timestamp: Date.now(),
            } as VioletKanbanAction);
            return;
        }
        q.enqueueListAction({
            type: 'update-list',
            payload: { data },
            timestamp: Date.now(),
        } as VioletKanbanAction);
    };
}

export function useVioletKanbanEnqueueCardCreateOrUpdate() {
    const q = useQueues();
    return (data: Partial<BoardCard> | (CardCreate & { id?: string })) => {
        const idCandidate = (data as { id?: string })?.id;
        if (
            (typeof idCandidate === 'string' &&
                idCandidate.startsWith('temp-')) ||
            !idCandidate
        ) {
            const tempId =
                (typeof idCandidate === 'string' && idCandidate) ||
                `card-temp-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`;
            const { id: _id, ...createDataRaw } = data as CardCreate &
                Record<string, unknown>;
            const createData = {
                ...(createDataRaw as CardCreate),
            } as CardCreate;
            if (
                isObject(data) &&
                'boardId' in (data as Record<string, unknown>)
            ) {
                (createData as CardCreate).boardId = (
                    data as Record<string, unknown>
                ).boardId as string;
            }
            if (
                isObject(data) &&
                'listId' in (data as Record<string, unknown>)
            ) {
                (createData as CardCreate).listId = (
                    data as Record<string, unknown>
                ).listId as string;
            }
            q.enqueueCardAction({
                type: 'create-card',
                payload: { data: createData, tempId },
                timestamp: Date.now(),
            } as VioletKanbanAction);
            return;
        }
        q.enqueueCardAction({
            type: 'update-card',
            payload: { data },
            timestamp: Date.now(),
        } as VioletKanbanAction);
    };
}

export function useVioletKanbanEnqueueCardMove() {
    const q = useQueues();
    return (payload: {
        id: string;
        newIndex: number;
        listId: string;
        boardId?: string;
    }) => {
        q.enqueueCardAction({
            type: 'move-card',
            payload: {
                id: payload.id,
                newIndex: payload.newIndex,
                listId: payload.listId,
                boardId: payload.boardId ?? '',
            },
            timestamp: Date.now(),
        } as VioletKanbanAction);
    };
}

export function useVioletKanbanEnqueueCardDelete() {
    const q = useQueues();
    return (id: string) =>
        q.enqueueCardAction({
            type: 'delete-card',
            payload: { id },
            timestamp: Date.now(),
        } as VioletKanbanAction);
}

export function useVioletKanbanEnqueueListDelete() {
    const q = useQueues();
    return (id: string) =>
        q.enqueueListAction({
            type: 'delete-list',
            payload: { id },
            timestamp: Date.now(),
        } as VioletKanbanAction);
}

export function useVioletKanbanEnqueueBoardDelete() {
    const q = useQueues();
    return (id: string) =>
        q.enqueueBoardAction({
            type: 'delete-board',
            payload: { id },
            timestamp: Date.now(),
        } as VioletKanbanAction);
}

export function useVioletKanbanRemoveBoardAction() {
    const q = useQueues();
    return q.removeBoardAction;
}

export function useVioletKanbanRemoveListAction() {
    const q = useQueues();
    return q.removeListAction;
}

export function useVioletKanbanRemoveCardAction() {
    const q = useQueues();
    return q.removeCardAction;
}

export function useVioletKanbanHandleBoardActionSuccess() {
    const q = useQueues();
    const tempMap = useTempIdMap();
    const boardApi = useBoards();
    return (tempId: string | undefined, newBoard: Board) => {
        if (!tempId) return;
        const realId = newBoard.id;
        tempMap.setMapping(tempId, realId);
        boardApi.addBoard(newBoard);
        q.removeBoardAction(tempId);
        tempMap.clearMapping(tempId);
    };
}

export function useVioletKanbanHandleListActionSuccess() {
    const q = useQueues();
    const tempMap = useTempIdMap();
    const listApi = useLists();
    return (tempId: string | undefined, newList: BoardList) => {
        if (!tempId) return;
        const realId = newList.id;
        tempMap.setMapping(tempId, realId);
        listApi.addList(newList);
        q.removeListAction(tempId);
        tempMap.clearMapping(tempId);
    };
}

export function useVioletKanbanHandleCardActionSuccess() {
    const q = useQueues();
    const tempMap = useTempIdMap();
    const cardApi = useCards();
    return (tempId: string | undefined, newCard: BoardCard) => {
        if (!tempId) return;
        const realId = newCard.id;
        tempMap.setMapping(tempId, realId);
        cardApi.addCard(newCard);
        q.removeCardAction(tempId);
        tempMap.clearMapping(tempId);
    };
}
