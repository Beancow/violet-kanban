import { safeCaptureException } from '@/lib/sentryWrapper';
import {
    isObject,
    hasTempId,
    hasBoardProp,
    hasListProp,
    hasCardProp,
    hasTimestampProp,
    hasTypeProp,
    hasOrganizationIdInData,
    hasIdProp,
    isBoardCardLike,
    isBoardListLike,
    isBoardLike,
} from '@/types/typeGuards';
import {
    unwrapQueueAction,
    getActionItemId,
    isQueueItem,
    scheduleNextAttempt,
} from '@/providers/helpers';
import { isValidWorkerAction, sanitizeQueue } from '@/providers/helpers';
import pickNextFromQueues from '@/services/syncJobs/pickNextJob';
import buildActionToPost from '@/services/syncJobs/buildActionJob';
import postAndAwait from '@/services/syncJobs/postAndAwaitJob';
import applyBackoffAndPersist from '@/services/syncJobs/backoffJob';
import type { VioletKanbanAction } from '@/types';
import { onEvent, emitEvent } from '@/utils/eventBusClient';
import InFlightManager from '@/services/inFlightManager';
import WorkerPoster from '@/services/workers/workerPoster';
import handleActionSuccess, {
    handleCardSuccess,
    handleListSuccess,
    handleBoardSuccess,
} from '@/services/syncJobs/actionSuccessJob';
import workerMessageHandler, {
    WorkerMessageCtx,
} from '@/services/workers/workerMessageHandler';

export type QueueApiLike = {
    state: any;
    removeBoardAction?: (id: string) => void;
    removeListAction?: (id: string) => void;
    removeCardAction?: (id: string) => void;
    enqueueCardAction?: (a: any) => void;
    enqueueListAction?: (a: any) => void;
    enqueueBoardAction?: (a: any) => void;
    updateQueueMeta?: (id: string, meta: any) => void;
};

export type SyncErrorLike = {
    addError?: (e: any) => void;
};

export type FreshTokenFn = () => Promise<string | null | undefined>;

export type WebWorkerPoster = (m: any) => void;

export class SyncOrchestrator {
    private queueApi: QueueApiLike;
    private syncError: SyncErrorLike | undefined;
    private getFreshToken: FreshTokenFn;
    private postMessage: WebWorkerPoster;
    private reconciliation: any;
    private tempMap: any;
    private orgProvider: { currentOrganizationId?: string | null } | undefined;
    private processing = false;

    // Local in-memory attempt tracking for queue items. This avoids
    // aggressive immediate retries without requiring persistence changes
    // to the QueueProvider. Keys are QueueItem.id.
    private attemptsMap: Record<
        string,
        { attempts: number; nextAttemptAt: number | null; lastError?: string }
    > = {};

    private inFlight: {
        waiting: boolean;
        id?: string | undefined;
        promise?: Promise<void> | undefined;
        resolve?: (() => void) | undefined;
        timeout?: number | undefined;
        meta?: any;
    } = { waiting: false };
    private inFlightManager: InFlightManager;
    private workerPoster: WorkerPoster;
    private currentInFlightMeta: any | undefined;

    private scheduledTimeouts: number[] = [];
    private outgoingLogs: Array<Record<string, unknown>> = [];
    private outgoingClearTimeout?: number | undefined;
    private mounted = false;

    private scheduleTimeout(fn: () => void, ms: number) {
        if (!this.mounted) return undefined;
        const id = window.setTimeout(fn, ms) as unknown as number;
        try {
            this.scheduledTimeouts.push(id);
        } catch (_) {}
        return id;
    }

    constructor(opts: {
        queueApi: QueueApiLike;
        syncError?: SyncErrorLike;
        getFreshToken: FreshTokenFn;
        postMessage: WebWorkerPoster;
        reconciliation?: any;
        tempMap?: any;
        orgProvider?: { currentOrganizationId?: string };
    }) {
        this.queueApi = opts.queueApi;
        this.syncError = opts.syncError;
        this.getFreshToken = opts.getFreshToken;
        this.postMessage = opts.postMessage;
        this.reconciliation = opts.reconciliation;
        this.tempMap = opts.tempMap;
        this.orgProvider = opts.orgProvider;
        this.inFlightManager = new InFlightManager();
        this.workerPoster = new WorkerPoster({
            postMessage: this.postMessage,
            getFreshToken: this.getFreshToken,
            orgProvider: this.orgProvider,
        });
    }

    private async processQueuedActions() {
        try {
            // prevent re-entrancy: set a short-lived processing lock as early as
            // possible so multiple calls to processQueuedActions don't post
            // concurrently.
            if (this.processing) return;
            this.processing = true;

            const freshToken = await this.getFreshToken();

            const queueApiLocal = this.queueApi;
            const state = queueApiLocal.state;
            const sanitizers: Array<[any[] | undefined, (id: string) => void]> =
                [
                    [state.boardActionQueue, queueApiLocal.removeBoardAction!],
                    [state.listActionQueue, queueApiLocal.removeListAction!],
                    [state.cardActionQueue, queueApiLocal.removeCardAction!],
                ];
            sanitizers.forEach(([q, remover]) => sanitizeQueue(q, remover));

            const now = Date.now();

            const pickNextFrom = (queues: Array<any[] | undefined>) =>
                pickNextFromQueues(queues);

            // Priority order: boards, then lists, then cards. Call the picker
            // separately for each queue instance so callers don't need to
            // introspect payload shapes later.
            let selectedQueue: any[] | undefined;
            const boardQueue = pickNextFrom([state.boardActionQueue]);
            if (boardQueue && boardQueue.length > 0) selectedQueue = boardQueue;
            else {
                const listQueue = pickNextFrom([state.listActionQueue]);
                if (listQueue && listQueue.length > 0)
                    selectedQueue = listQueue;
                else {
                    const cardQueue = pickNextFrom([state.cardActionQueue]);
                    if (cardQueue && cardQueue.length > 0)
                        selectedQueue = cardQueue;
                }
            }

            if (!selectedQueue) return;

            const nextItem = selectedQueue[0];
            const action = unwrapQueueAction(nextItem) as VioletKanbanAction;
            if (!isValidWorkerAction(action)) {
                try {
                    if (isQueueItem(nextItem)) {
                        const q = nextItem as any;
                        const id = typeof q.id === 'string' ? q.id : undefined;
                        if (id) {
                            this.queueApi.removeBoardAction?.(id);
                            this.queueApi.removeListAction?.(id);
                            this.queueApi.removeCardAction?.(id);
                        }
                    }
                } catch (e) {
                    safeCaptureException(e as Error);
                }
                if (this.mounted)
                    this.scheduleTimeout(
                        () => void this.processQueuedActions(),
                        0
                    );
                return;
            }

            if (this.inFlight.waiting) return;

            // Orchestrator doesn't own organizationId; callers (SyncBootstrap)
            // can inject an orgProvider. Prefer explicit organizationId on the
            // action payload, otherwise fall back to the injected provider.
            const orgProviderRef = this.orgProvider;
            const orgId = hasOrganizationIdInData((action as any).payload)
                ? (action as any).payload.data.organizationId
                : orgProviderRef?.currentOrganizationId;

            // buildActionToPost is provided by the small job module (imported above)

            const actionToPost = buildActionToPost(action, freshToken, orgId);
            const actionId = getActionItemId(action);
            // Setup in-flight manager and post to worker via WorkerPoster
            this.inFlight.id = actionId;
            this.inFlight.meta =
                (isQueueItem(nextItem) ? (nextItem as any).meta : undefined) ||
                undefined;
            this.currentInFlightMeta = this.inFlight.meta;
            this.inFlight.waiting = true;
            emitEvent('sync:started', undefined as any);
            try {
                const TIMEOUT_MS = 30_000;
                // Post and await using small job (provide explicit actionId)
                await postAndAwait(
                    this.inFlightManager,
                    this.workerPoster,
                    actionId,
                    actionToPost,
                    TIMEOUT_MS
                );
            } catch (e) {
                const syncErrorLocal = this.syncError;
                const errObj = e instanceof Error ? e : new Error(String(e));
                // record error to syncError provider
                if (syncErrorLocal) {
                    try {
                        syncErrorLocal.addError?.({
                            timestamp: Date.now(),
                            message: errObj.message,
                        });
                    } catch (_) {}
                }

                // Centralize backoff and persistence through the job
                try {
                    const qid = this.inFlight.id as string | undefined;
                    const updatedMeta = applyBackoffAndPersist(
                        qid,
                        this.inFlight.meta,
                        this.attemptsMap,
                        this.queueApi,
                        errObj as Error
                    );
                    if (updatedMeta.nextAttemptAt) {
                        const delay = Math.max(
                            0,
                            updatedMeta.nextAttemptAt - Date.now()
                        );
                        if (this.mounted)
                            this.scheduleTimeout(
                                () => void this.processQueuedActions(),
                                delay
                            );
                    }
                } catch (ee) {
                    safeCaptureException(ee as Error);
                }
            } finally {
                try {
                    this.inFlightManager.clear();
                } catch (_) {}
                this.inFlight.waiting = false;
                this.inFlight.id = undefined;
                this.inFlight.meta = undefined;
                this.currentInFlightMeta = undefined;
                this.processing = false;
                emitEvent('sync:stopped', undefined as any);
                // If we didn't already schedule a backoff-based retry above,
                // schedule an immediate retry (next tick) so the queue keeps
                // processing.
                try {
                    const qid = this.inFlight.id as string | undefined;
                    const meta = (this.inFlight.meta as any) || {};
                    if (!meta.nextAttemptAt) {
                        if (this.mounted)
                            this.scheduleTimeout(
                                () => void this.processQueuedActions(),
                                0
                            );
                    }
                } catch (_) {
                    if (this.mounted)
                        this.scheduleTimeout(
                            () => void this.processQueuedActions(),
                            0
                        );
                }
            }
        } catch (e) {
            console.error('[SyncOrchestrator] processQueuedActions failed', e);
        }
    }

    // worker messages are delegated to a standalone handler service
    public async handleWorkerMessage(mIn: any) {
        const ctx: WorkerMessageCtx = {
            outgoingLogs: this.outgoingLogs,
            outgoingClearTimeout: this.outgoingClearTimeout,
            inFlightManager: this.inFlightManager,
            attemptsMap: this.attemptsMap,
            queueApi: this.queueApi,
            tempMap: this.tempMap,
            syncError: this.syncError,
        };
        await workerMessageHandler(ctx, mIn);
    }
}

export default SyncOrchestrator;
