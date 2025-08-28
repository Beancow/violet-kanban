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
    isStringId,
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
import type { QueueItem } from '@/types/violet-kanban-action';
import type {
    FreshTokenFn,
    WebWorkerPoster,
    SyncErrorLike,
    QueueApiLike,
} from '@/types/services';
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

// Minimal QueueItem shape used by the orchestrator. Keep narrow to avoid
// reintroducing `any` while matching runtime expectations.
// No local QueueItem alias—use the canonical `QueueItem` imported above.

// ...existing code... (removed local aliases to avoid inline type declarations)

export class SyncOrchestrator {
    private queueApi: QueueApiLike;
    private syncError: SyncErrorLike | undefined;
    private getFreshToken: FreshTokenFn;
    private postMessage: WebWorkerPoster;
    private reconciliation: object | undefined;
    private tempMap: object | undefined;
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
        meta?: object | undefined;
    } = { waiting: false };
    private inFlightManager: InFlightManager;
    private workerPoster: WorkerPoster;
    private currentInFlightMeta: object | undefined;

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
            const state = queueApiLocal.state ?? {};
            const sanitizers: Array<
                [
                    Array<VioletKanbanAction | QueueItem> | undefined,
                    (id: string) => void
                ]
            > = [
                [
                    state.boardActionQueue as
                        | Array<VioletKanbanAction | QueueItem>
                        | undefined,
                    queueApiLocal.removeBoardAction!,
                ],
                [
                    state.listActionQueue as
                        | Array<VioletKanbanAction | QueueItem>
                        | undefined,
                    queueApiLocal.removeListAction!,
                ],
                [
                    state.cardActionQueue as
                        | Array<VioletKanbanAction | QueueItem>
                        | undefined,
                    queueApiLocal.removeCardAction!,
                ],
            ];
            sanitizers.forEach(([q, remover]) => sanitizeQueue(q, remover));

            const now = Date.now();

            const pickNextFrom = (
                queues: Array<Array<VioletKanbanAction | QueueItem> | undefined>
            ) => pickNextFromQueues(queues);

            // Priority order: boards, then lists, then cards. Call the picker
            // separately for each queue instance so callers don't need to
            // introspect payload shapes later.
            let selectedQueue:
                | Array<VioletKanbanAction | QueueItem>
                | undefined;
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
                        const id =
                            hasIdProp(nextItem) &&
                            isStringId((nextItem as { id?: unknown }).id)
                                ? (nextItem as { id?: string }).id
                                : undefined;
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
            const orgIdNullable = hasOrganizationIdInData(action.payload)
                ? (action.payload as { data?: { organizationId?: string } })
                      .data?.organizationId
                : orgProviderRef?.currentOrganizationId;
            const orgId = orgIdNullable ?? undefined;

            // buildActionToPost is provided by the small job module (imported above)

            const actionToPost = buildActionToPost(action, freshToken, orgId);
            const actionId = getActionItemId(action);
            // Setup in-flight manager and post to worker via WorkerPoster
            this.inFlight.id = actionId;
            this.inFlight.meta =
                (isQueueItem(nextItem)
                    ? (nextItem as { meta?: object }).meta
                    : undefined) || undefined;
            this.currentInFlightMeta = this.inFlight.meta;
            this.inFlight.waiting = true;
            emitEvent('sync:started', undefined);
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
                emitEvent('sync:stopped', undefined);
                // If we didn't already schedule a backoff-based retry above,
                // schedule an immediate retry (next tick) so the queue keeps
                // processing.
                try {
                    const qid = this.inFlight.id as string | undefined;
                    const meta = this.inFlight.meta ?? {};
                    if (
                        !(
                            meta &&
                            typeof meta === 'object' &&
                            'nextAttemptAt' in meta
                        )
                    ) {
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
    public async handleWorkerMessage(mIn: object) {
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

    // Start orchestrator: mark mounted and kick off processing loop
    public start() {
        this.mounted = true;
        try {
            this.scheduleTimeout(() => void this.processQueuedActions(), 0);
        } catch (_) {}
    }

    // Stop orchestrator: clear mounted flag and any scheduled timeouts
    public stop() {
        this.mounted = false;
        try {
            for (const t of this.scheduledTimeouts) {
                try {
                    window.clearTimeout(t as number);
                } catch (_) {}
            }
        } catch (_) {}
        this.scheduledTimeouts = [];
        try {
            this.inFlightManager.clear();
        } catch (_) {}
    }
}

export default SyncOrchestrator;
