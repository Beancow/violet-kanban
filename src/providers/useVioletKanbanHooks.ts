import { useBoardStore } from './BoardProvider';
import { useListStore } from './ListProvider';
import { useCardStore } from './CardProvider';
import { useQueueStore } from './QueueProvider';
import { useTempIdMap } from './TempIdMapProvider';

// Adapters: providers expose API objects; wrap them into convenient hooks
export function useVioletKanbanData() {
    const boardApi = useBoardStore();
    const listApi = useListStore();
    const cardApi = useCardStore();
    const boards = boardApi.state.boards as any[];
    const lists = listApi.state.lists as any[];
    const cards = cardApi.state.cards as any[];
    return { boards, lists, cards };
}

export function useVioletKanbanOrphanedCards() {
    const cardApi = useCardStore();
    return (cardApi.state.orphanedCards as any[]) ?? [];
}

export function useVioletKanbanQueues() {
    const q = useQueueStore();
    return {
        boardActionQueue: q.state.boardActionQueue,
        listActionQueue: q.state.listActionQueue,
        cardActionQueue: q.state.cardActionQueue,
    };
}

export function useVioletKanbanAddBoard() {
    const b = useBoardStore();
    return b.addBoard;
}

export function useVioletKanbanAddList() {
    const l = useListStore();
    return l.addList;
}

export function useVioletKanbanAddCard() {
    const c = useCardStore();
    return c.addCard;
}

export function useVioletKanbanEnqueueBoardCreateOrUpdate() {
    const q = useQueueStore();
    return (data: any) => {
        const idCandidate = data?.id;
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
            const createData = { ...data } as Record<string, unknown>;
            delete createData.id;
            q.enqueueBoardAction({
                type: 'create-board',
                payload: { data: createData, tempId },
                timestamp: Date.now(),
            } as any);
            return;
        }
        q.enqueueBoardAction({
            type: 'update-board',
            payload: { data },
            timestamp: Date.now(),
        } as any);
    };
}

export function useVioletKanbanEnqueueListCreateOrUpdate() {
    const q = useQueueStore();
    return (data: any) => {
        const idCandidate = data?.id;
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
            const createData = { ...data } as Record<string, unknown>;
            delete createData.id;
            (createData as Record<string, unknown>).boardId =
                (data as Record<string, unknown>).boardId ?? '';
            q.enqueueListAction({
                type: 'create-list',
                payload: { data: createData, tempId },
                timestamp: Date.now(),
            } as any);
            return;
        }
        q.enqueueListAction({
            type: 'update-list',
            payload: { data },
            timestamp: Date.now(),
        } as any);
    };
}

export function useVioletKanbanEnqueueCardCreateOrUpdate() {
    const q = useQueueStore();
    return (data: any) => {
        const idCandidate = data?.id;
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
            const createData = { ...data } as Record<string, unknown>;
            delete createData.id;
            (createData as Record<string, unknown>).boardId =
                (data as Record<string, unknown>).boardId ?? '';
            (createData as Record<string, unknown>).listId =
                (data as Record<string, unknown>).listId ?? '';
            q.enqueueCardAction({
                type: 'create-card',
                payload: { data: createData, tempId },
                timestamp: Date.now(),
            } as any);
            return;
        }
        q.enqueueCardAction({
            type: 'update-card',
            payload: { data },
            timestamp: Date.now(),
        } as any);
    };
}

export function useVioletKanbanEnqueueCardMove() {
    const q = useQueueStore();
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
        } as any);
    };
}

export function useVioletKanbanEnqueueCardDelete() {
    const q = useQueueStore();
    return (id: string) =>
        q.enqueueCardAction({
            type: 'delete-card',
            payload: { id },
            timestamp: Date.now(),
        } as any);
}

export function useVioletKanbanEnqueueListDelete() {
    const q = useQueueStore();
    return (id: string) =>
        q.enqueueListAction({
            type: 'delete-list',
            payload: { id },
            timestamp: Date.now(),
        } as any);
}

export function useVioletKanbanEnqueueBoardDelete() {
    const q = useQueueStore();
    return (id: string) =>
        q.enqueueBoardAction({
            type: 'delete-board',
            payload: { id },
            timestamp: Date.now(),
        } as any);
}

export function useVioletKanbanRemoveBoardAction() {
    const q = useQueueStore();
    return q.removeBoardAction;
}

export function useVioletKanbanRemoveListAction() {
    const q = useQueueStore();
    return q.removeListAction;
}

export function useVioletKanbanRemoveCardAction() {
    const q = useQueueStore();
    return q.removeCardAction;
}

export function useVioletKanbanHandleBoardActionSuccess() {
    const q = useQueueStore();
    const tempMap = useTempIdMap();
    const boardApi = useBoardStore();
    return (tempId: string | undefined, newBoard: any) => {
        if (!tempId) return;
        const realId = newBoard.id;
        tempMap.setMapping(tempId, realId);
        boardApi.addBoard(newBoard);
        q.removeBoardAction(tempId);
        tempMap.clearMapping(tempId);
    };
}

export function useVioletKanbanHandleListActionSuccess() {
    const q = useQueueStore();
    const tempMap = useTempIdMap();
    const listApi = useListStore();
    return (tempId: string | undefined, newList: any) => {
        if (!tempId) return;
        const realId = newList.id;
        tempMap.setMapping(tempId, realId);
        listApi.addList(newList);
        q.removeListAction(tempId);
        tempMap.clearMapping(tempId);
    };
}

export function useVioletKanbanHandleCardActionSuccess() {
    const q = useQueueStore();
    const tempMap = useTempIdMap();
    const cardApi = useCardStore();
    return (tempId: string | undefined, newCard: any) => {
        if (!tempId) return;
        const realId = newCard.id;
        tempMap.setMapping(tempId, realId);
        cardApi.addCard(newCard);
        q.removeCardAction(tempId);
        tempMap.clearMapping(tempId);
    };
}
