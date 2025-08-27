import type {
    VioletKanbanAction,
    QueueItem,
} from '@/types/violet-kanban-action';
import type { QueueMeta } from '@/types/violet-kanban-action';
import { isObject, hasUserId, isActionLike } from '@/types/typeGuards';
import type { SyncAction } from '@/types/worker.type';
import type { Board, BoardList, BoardCard } from '@/types/appState.type';

// Detect conflicts for board, list, and card updates in the action queue
export function detectActionConflicts(
    actionQueue: Array<VioletKanbanAction | QueueItem>,
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
    actionQueue.forEach((maybeItem) => {
        const action = unwrapQueueAction(maybeItem);
        // helper to safely pull payload.data when present
        const payload = hasPayload(action) ? action.payload : undefined;
        const _data =
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

export function isQueueItem(x: unknown): x is QueueItem {
    return (
        isObject(x) &&
        typeof (x as Record<string, unknown>).id === 'string' &&
        'action' in (x as Record<string, unknown>)
    );
}

export function unwrapQueueAction(
    x: VioletKanbanAction | QueueItem
): VioletKanbanAction {
    if (isQueueItem(x)) return x.action;
    return x as VioletKanbanAction;
}

// simple deterministic string hash for fallback id generation
function simpleHash(input: string) {
    let h = 0;
    for (let i = 0; i < input.length; i++) {
        h = (h << 5) - h + input.charCodeAt(i);
        h |= 0; // convert to 32bit int
    }
    return Math.abs(h).toString(36);
}

export function computeQueueItemId(
    actionOrItem: VioletKanbanAction | QueueItem
) {
    const action = unwrapQueueAction(actionOrItem);
    const key = getActionItemId(action);
    if (key) return `${action.type}:${key}`;
    // fallback: deterministic hash of payload
    const payload = hasPayload(action) ? action.payload : {};
    try {
        const s = JSON.stringify(payload);
        return `${action.type}:${simpleHash(s)}`;
    } catch (e) {
        return `${action.type}:${Date.now()}`;
    }
}

// Exponential backoff helper for scheduling retries. Returns milliseconds.
export function computeBackoffMs(attempts = 0) {
    // base 1s, double each attempt, cap at 60s
    const base = 1000;
    const factor = 2;
    const max = 60 * 1000;
    const next = Math.min(max, Math.floor(base * Math.pow(factor, attempts)));
    // add +/-50% jitter
    const jitter = Math.floor((Math.random() - 0.5) * next);
    return Math.max(0, next + jitter);
}

// Return an updated QueueMeta scheduling the next attempt after an error.
export function scheduleNextAttempt(
    meta: QueueMeta,
    err?: Error | null,
    attemptsLimit = 5
) {
    const currentAttempts = meta.attempts ?? 0;
    const nextAttempts = currentAttempts + 1;
    const exceeded = nextAttempts >= attemptsLimit;
    const nextAttemptAt = exceeded
        ? null
        : Date.now() + computeBackoffMs(nextAttempts);
    return {
        ...meta,
        attempts: nextAttempts,
        nextAttemptAt,
        lastError: err ? String(err.message ?? err) : meta.lastError ?? null,
    } as QueueMeta;
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

function hasTimestampField(x: unknown): x is { timestamp: number } {
    return (
        isObject(x) &&
        typeof (x as Record<string, unknown>).timestamp === 'number'
    );
}

function isSyncActionWithData(
    action: VioletKanbanAction
): action is SyncAction & { payload: { data: Record<string, unknown> } } {
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
    actionOrItem: VioletKanbanAction | QueueItem
): string | undefined {
    // If a QueueItem is provided, prefer its explicit id (canonical dedupe key)
    if (isQueueItem(actionOrItem)) return actionOrItem.id;
    const action = unwrapQueueAction(actionOrItem);
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
    // New: support org fetch actions which carry payload.userId
    if (hasUserId(p)) return (p as Record<string, unknown>).userId as string;
    if (hasIdField(p)) return p.id;
    if (hasTempIdField(p)) return p.tempId;
    return undefined;
}

export function squashQueueActions(queue: QueueItem[], newItem: QueueItem) {
    const filteredQueue = queue.filter((item) => item.id !== newItem.id);
    return [...filteredQueue, newItem];
}

// Determines if an action is stale compared to a server updatedAt ISO string
export function isActionStale(
    action: { timestamp?: number } | undefined,
    serverUpdatedAt?: string | undefined
) {
    if (!action || !action.timestamp) return false;
    if (!serverUpdatedAt) return false;
    const serverMs = Date.parse(serverUpdatedAt);
    if (isNaN(serverMs)) return false;
    return (action.timestamp ?? 0) < serverMs;
}

function getActionTimestamp(action: unknown): number | undefined {
    if (hasTimestampField(action)) return action.timestamp;
    // also check nested payload (some actions put timestamp on the payload)
    if (
        isObject(action) &&
        'payload' in action &&
        isObject((action as Record<string, unknown>).payload)
    ) {
        const p = (action as Record<string, unknown>).payload as Record<
            string,
            unknown
        >;
        const t = p.timestamp as unknown;
        return typeof t === 'number' ? (t as number) : undefined;
    }
    return undefined;
}

// Specific helper to check card update actions against server card list
export function isCardActionStale(
    action: VioletKanbanAction | undefined,
    cards: BoardCard[] = []
) {
    if (!action) return false;
    const id = getActionItemId(action);
    if (!id) return false;
    const serverCard = cards.find((c) => c.id === id);
    if (!serverCard) return false;
    const serverUpdatedAt = extractUpdatedAt(serverCard.updatedAt);
    const ts = getActionTimestamp(action);
    return isActionStale(ts ? { timestamp: ts } : undefined, serverUpdatedAt);
}

// Lightweight validation to determine if an action is safe to post to the
// worker. This mirrors the minimal checks used in SyncManager to avoid
// posting malformed actions that can cause the worker to crash.
export function isValidWorkerAction(x: unknown): boolean {
    try {
        if (!isObject(x)) return false;
        const a = x as Record<string, unknown>;
        if (typeof a.type !== 'string') return false;
        if ('payload' in a && a.payload !== undefined && !isObject(a.payload))
            return false;
        // Basic specific checks: ensure create-card has data present when used
        if (a.type === 'create-card') {
            const p = a.payload as Record<string, unknown> | undefined;
            if (!p || !('data' in p)) return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

// Remove malformed queue items by inspecting each QueueItem and calling the
// provided removal function when the item is invalid for worker processing.
export function sanitizeQueue(
    q: any[] | undefined,
    removeFn?: (id: string) => void
) {
    if (!q || q.length === 0 || !removeFn) return;
    for (const item of q) {
        try {
            if (!isQueueItem(item)) continue;
            const action = unwrapQueueAction(item);
            if (!isActionLike(action) || !isValidWorkerAction(action)) {
                const id = (item as any).id as string | undefined;
                if (id) {
                    try {
                        removeFn(id);
                    } catch (e) {
                        /* ignore removal errors */
                    }
                }
            }
        } catch (e) {
            /* ignore per-item sanitize errors */
        }
    }
}
