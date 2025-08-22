import type { VioletKanbanAction } from '@/types/violet-kanban-action';
import type { SyncAction } from '@/types/worker.type';
import type { Board, BoardList, BoardCard } from '@/types/appState.type';

// Detect conflicts for board, list, and card updates in the action queue
export function detectActionConflicts(
    actionQueue: VioletKanbanAction[],
    boards: Board[],
    lists: BoardList[],
    cards: BoardCard[]
) {
    const conflicts: Array<{
        id: string;
        local: Board | BoardList | BoardCard;
        server: Board | BoardList | BoardCard;
        action: VioletKanbanAction;
        type: 'board' | 'list' | 'card';
    }> = [];
    actionQueue.forEach((action) => {
        // helper to safely pull payload.data when present
        const payload = hasPayload(action) ? action.payload : undefined;
        const data =
            payload &&
            isObject(payload) &&
            'data' in payload &&
            isObject(payload.data)
                ? payload.data
                : undefined;

        if (action.type === 'update-board' && isSyncActionWithData(action)) {
            const local = action.payload.data as Partial<Board> & {
                id: string;
            };
            const server = boards.find((b) => b.id === local.id);
            const localUpdated = extractUpdatedAt(local.updatedAt);
            const serverUpdated = server
                ? extractUpdatedAt(server.updatedAt)
                : undefined;
            if (
                server &&
                localUpdated &&
                serverUpdated &&
                localUpdated !== serverUpdated
            ) {
                conflicts.push({
                    id: local.id,
                    local: local as Board,
                    server: server as Board,
                    action,
                    type: 'board',
                });
            }
        } else if (
            action.type === 'update-list' &&
            isSyncActionWithData(action)
        ) {
            const local = action.payload.data as Partial<BoardList> & {
                id: string;
            };
            const server = lists.find((l) => l.id === local.id);
            const localUpdated = extractUpdatedAt(local.updatedAt);
            const serverUpdated = server
                ? extractUpdatedAt(server.updatedAt)
                : undefined;
            if (
                server &&
                localUpdated &&
                serverUpdated &&
                localUpdated !== serverUpdated
            ) {
                conflicts.push({
                    id: local.id,
                    local: local as BoardList,
                    server: server as BoardList,
                    action,
                    type: 'list',
                });
            }
        } else if (
            action.type === 'update-card' &&
            isSyncActionWithData(action)
        ) {
            const local = action.payload.data as Partial<BoardCard> & {
                id: string;
            };
            const server = cards.find((c) => c.id === local.id);
            const localUpdated = extractUpdatedAt(local.updatedAt);
            const serverUpdated = server
                ? extractUpdatedAt(server.updatedAt)
                : undefined;
            if (
                server &&
                localUpdated &&
                serverUpdated &&
                localUpdated !== serverUpdated
            ) {
                conflicts.push({
                    id: local.id,
                    local: local as BoardCard,
                    server: server as BoardCard,
                    action,
                    type: 'card',
                });
            }
        }
    });
    return conflicts;
}

function isObject(x: unknown): x is Record<string, unknown> {
    return typeof x === 'object' && x !== null;
}

function hasPayload(
    action: VioletKanbanAction
): action is VioletKanbanAction & { payload: unknown } {
    // runtime check for the presence of a payload property
    // use a safe cast to access the payload property without `any`
    return (
        'payload' in action &&
        (action as { payload?: unknown }).payload !== undefined
    );
}

function payloadIsRecord(payload: unknown): payload is Record<string, unknown> {
    return isObject(payload);
}

function hasIdField(x: unknown): x is { id: string } {
    return isObject(x) && typeof (x as Record<string, unknown>).id === 'string';
}

function hasTempIdField(x: unknown): x is { tempId: string } {
    return (
        isObject(x) && typeof (x as Record<string, unknown>).tempId === 'string'
    );
}

function isSyncActionWithData(
    action: VioletKanbanAction
): action is SyncAction & { payload: { data: unknown } } {
    // SyncAction types that have payload.data are the update/create actions for board/list/card
    if (!hasPayload(action)) return false;
    const payload = action.payload;
    if (!payloadIsRecord(payload)) return false;
    return (
        'data' in payload && isObject((payload as Record<string, unknown>).data)
    );
}

function extractUpdatedAt(value: unknown): string | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    return undefined;
}

export function getActionItemId(
    action: VioletKanbanAction
): string | undefined {
    if (!hasPayload(action)) return undefined;
    const payload = action.payload;
    if (!payloadIsRecord(payload)) return undefined;

    const p = payload;

    // check payload.data.{id,tempId}
    if ('data' in p && isObject(p.data)) {
        const d = p.data;
        if (hasIdField(d)) return d.id;
        if (hasTempIdField(d)) return d.tempId;
    }

    // check payload.id / payload.tempId
    if (hasIdField(p)) return p.id;
    if (hasTempIdField(p)) return p.tempId;
    return undefined;
}

export function squashQueueActions(
    queue: VioletKanbanAction[],
    newAction: VioletKanbanAction
) {
    const newId = getActionItemId(newAction);
    const newType = newAction.type;
    const filteredQueue = queue.filter((action) => {
        const id = getActionItemId(action);
        return !(id && newId && id === newId && action.type === newType);
    });
    return [...filteredQueue, newAction];
}
