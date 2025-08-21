import type { VioletKanbanAction } from './appStore';
import type { Board, BoardList, BoardCard } from '../types/appState.type';
import { isObject, hasDataProp, hasIdProp, hasTempIdProp, isStringId, isDateLike, isBoardLike, isBoardListLike, isBoardCardLike } from '@/types/typeGuards';

// Detect conflicts for board, list, and card updates in the action queue
export function detectActionConflicts(
    actionQueue: VioletKanbanAction[],
    boards: Board[],
    lists: BoardList[],
    cards: BoardCard[]
): Array<{
    id: string;
    local: Board | BoardList | BoardCard;
    server: Board | BoardList | BoardCard;
    action: VioletKanbanAction;
    type: 'board' | 'list' | 'card';
}> {
    const conflicts: Array<{
        id: string;
        local: Board | BoardList | BoardCard;
        server: Board | BoardList | BoardCard;
        action: VioletKanbanAction;
        type: 'board' | 'list' | 'card';
    }> = [];
    actionQueue.forEach((action) => {
        if (action.type === 'update-board' && hasDataProp(action.payload)) {
            const localPayload = action.payload.data;
            if (isBoardLike(localPayload)) {
                const local = localPayload;
                const server = boards.find((b) => b.id === local.id);
                if (server && local.updatedAt && server.updatedAt && local.updatedAt !== server.updatedAt) {
                    conflicts.push({ id: local.id, local, server: server as Board, action, type: 'board' });
                }
            }
        } else if (action.type === 'update-list' && hasDataProp(action.payload)) {
            const localPayload = action.payload.data;
            if (isBoardListLike(localPayload)) {
                const local = localPayload;
                const server = lists.find((l) => l.id === local.id);
                if (server && local.updatedAt && server.updatedAt && local.updatedAt !== server.updatedAt) {
                    conflicts.push({ id: local.id, local, server: server as BoardList, action, type: 'list' });
                }
            }
        } else if (action.type === 'update-card' && hasDataProp(action.payload)) {
            const localPayload = action.payload.data;
            if (isBoardCardLike(localPayload)) {
                const local = localPayload;
                const server = cards.find((c) => c.id === local.id);
                if (server && local.updatedAt && server.updatedAt && local.updatedAt !== server.updatedAt) {
                    conflicts.push({ id: local.id, local, server: server as BoardCard, action, type: 'card' });
                }
            }
        }
    });
    return conflicts;
}

// Extract item id from action
export function getActionItemId(
    action: VioletKanbanAction
): string | undefined {
    if ('payload' in action) {
        // Prefer explicit id on data
        const payload: any = action.payload;
        if (
            payload.data &&
            typeof payload.data === 'object' &&
            'id' in payload.data
        ) {
            return payload.data.id as string;
        }
        // If an id field exists on payload directly
        if ('id' in payload) {
            return payload.id as string;
        }
        // Support temporary ids used for offline-create flows
        if ('tempId' in payload && payload.tempId) {
            return payload.tempId as string;
        }
        // Also support tempId inside data (some payload shapes put tempId there)
        if (
            payload.data &&
            typeof payload.data === 'object' &&
            'tempId' in payload.data
        ) {
            return payload.data.tempId as string;
        }
    }
    return undefined;
}

// Squash queue actions by item id and type
export function squashQueueActions(
    queue: VioletKanbanAction[],
    newAction: VioletKanbanAction
): VioletKanbanAction[] {
    const newId = getActionItemId(newAction);
    const newType = newAction.type;
    const filteredQueue = queue.filter((action) => {
        const id = getActionItemId(action);
        return !(id && newId && id === newId && action.type === newType);
    });
    return [...filteredQueue, newAction];
}

// Conflict detection helpers
export function isActionStale(
    localAction: VioletKanbanAction,
    serverUpdatedAt: string | number | undefined
): boolean {
    if (!serverUpdatedAt) return false;
    const localTimestamp = localAction.timestamp;
    const serverTimestamp =
        typeof serverUpdatedAt === 'string'
            ? Date.parse(serverUpdatedAt)
            : serverUpdatedAt;
    return serverTimestamp > localTimestamp;
}

export function isBoardActionStale(
    action: VioletKanbanAction,
    boards: Board[]
): boolean {
    const boardId = getActionItemId(action);
    if (!boardId) return false;
    const board = boards.find((b) => b.id === boardId);
    if (!board || !board.updatedAt) return false;
    let serverUpdatedAt: number;
    if (typeof board.updatedAt === 'string') {
        serverUpdatedAt = Date.parse(board.updatedAt);
    } else if (typeof board.updatedAt === 'number') {
        serverUpdatedAt = board.updatedAt;
    } else if (
        typeof board.updatedAt === 'object' &&
        board.updatedAt !== null &&
        typeof (board.updatedAt as Date).getTime === 'function'
    ) {
        serverUpdatedAt = (board.updatedAt as Date).getTime();
    } else {
        return false;
    }
    return serverUpdatedAt > action.timestamp;
}

export function isListActionStale(
    action: VioletKanbanAction,
    lists: BoardList[]
): boolean {
    const listId = getActionItemId(action);
    if (!listId) return false;
    const list = lists.find((l) => l.id === listId);
    if (!list || !list.updatedAt) return false;
    let serverUpdatedAt: number;
    if (typeof list.updatedAt === 'string') {
        serverUpdatedAt = Date.parse(list.updatedAt);
    } else if (typeof list.updatedAt === 'number') {
        serverUpdatedAt = list.updatedAt;
    } else if (
        typeof list.updatedAt === 'object' &&
        list.updatedAt !== null &&
        typeof (list.updatedAt as Date).getTime === 'function'
    ) {
        serverUpdatedAt = (list.updatedAt as Date).getTime();
    } else {
        return false;
    }
    return serverUpdatedAt > action.timestamp;
}

export function isCardActionStale(
    action: VioletKanbanAction,
    cards: BoardCard[]
): boolean {
    const cardId = getActionItemId(action);
    if (!cardId) return false;
    const card = cards.find((c) => c.id === cardId);
    if (!card || !card.updatedAt) return false;
    const serverUpdatedAt =
        typeof card.updatedAt === 'string'
            ? Date.parse(card.updatedAt)
            : card.updatedAt;
    return serverUpdatedAt > action.timestamp;
}

// Reconcile tempId with realId in store data and queues
export function reconcileTempId<T extends { id: string; tempId?: string }>(
    items: T[],
    tempId: string,
    realId: string
): T[] {
    return items.map((item) => {
        if (item.tempId === tempId) {
            return { ...item, id: realId, tempId: undefined };
        }
        return item;
    });
}
// Usage: Call reconcileTempId on boards, lists, cards, and queues after successful sync to replace tempId with realId.
