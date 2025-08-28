export type FreshTokenFn = () => Promise<string | null | undefined>;

export type WebWorkerPoster = (m: object) => void;

export type SyncErrorLike = {
    addError?: (e: { timestamp?: number; message?: string } | object) => void;
};

import type {
    VioletKanbanAction,
    QueueItem as VBQueueItem,
} from './violet-kanban-action';

export type QueueApiLike = {
    state?: {
        boardActionQueue?: Array<VioletKanbanAction | VBQueueItem>;
        listActionQueue?: Array<VioletKanbanAction | VBQueueItem>;
        cardActionQueue?: Array<VioletKanbanAction | VBQueueItem>;
        [k: string]: unknown;
    };
    removeBoardAction?: (id: string) => void;
    removeListAction?: (id: string) => void;
    removeCardAction?: (id: string) => void;
    enqueueCardAction?: (a: unknown) => void;
    enqueueListAction?: (a: unknown) => void;
    enqueueBoardAction?: (a: unknown) => void;
    updateQueueMeta?: (id: string, meta: unknown) => void;
};

// Lightweight interface describing the InFlightManager behaviour used by
// orchestrator and worker handlers. Keep it minimal to avoid importing the
// concrete class into the types bundle (prevents circular imports).
export type InFlightManagerLike = {
    resolveIfMatches(
        id?: string | undefined
    ): boolean | Promise<boolean> | undefined;
    clear(): void;
    resolveFor(id?: string | undefined): void; // optional helper used in tests/handlers
};

export type WorkerMessageCtxLite = {
    outgoingLogs: Array<Record<string, unknown>>;
    outgoingClearTimeout?: number | undefined;
    inFlightManager: InFlightManagerLike;
    attemptsMap: Record<string, unknown>;
    queueApi?: QueueApiLike;
    tempMap?: unknown;
    syncError?: SyncErrorLike;
};

export default {} as const;
