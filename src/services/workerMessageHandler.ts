import { safeCaptureException } from '@/lib/sentryWrapper';
import {
    isObject,
    hasTempId,
    hasBoardProp,
    hasListProp,
    hasCardProp,
    hasTimestampProp,
    hasTypeProp,
    hasIdProp,
    isBoardCardLike,
    isBoardListLike,
    isBoardLike,
} from '@/types/typeGuards';
import { onEvent, emitEvent } from '@/utils/eventBusClient';
import handleActionSuccess, {
    handleCardSuccess,
    handleListSuccess,
    handleBoardSuccess,
} from '@/services/syncJobs/actionSuccessJob';

export type QueueApiLike = {
    state?: any;
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

export type WorkerMessageCtx = {
    outgoingLogs: Array<Record<string, unknown>>;
    outgoingClearTimeout?: number | undefined;
    inFlightManager: any;
    attemptsMap: Record<string, any>;
    queueApi?: QueueApiLike;
    tempMap?: any;
    syncError?: SyncErrorLike;
};

export default async function handleWorkerMessage(
    ctx: WorkerMessageCtx,
    mIn: any
) {
    if (!mIn) return;
    const m = mIn as any;
    const { type, payload, error } = m;

    try {
        if (type === 'WORKER_OUTGOING' || type === 'WORKER_OUTGOING_RESULT') {
            const record = isObject(payload)
                ? (payload as Record<string, unknown>)
                : { payload };
            try {
                // keep a reference to the outgoing logs on the window for debug
                try {
                    (window as any).__violet_worker_outgoing = ctx.outgoingLogs;
                } catch (e) {
                    safeCaptureException(e as Error);
                }
            } catch (e) {
                safeCaptureException(e as Error);
            }
            return;
        }
    } catch (e) {
        safeCaptureException(e as Error);
    }

    if (type === 'ACTION_SUCCESS') {
        try {
            const payloadObj = isObject(payload) ? (payload as any) : undefined;
            if (payloadObj?.card) {
                try {
                    const id = payloadObj.card.id as string | undefined;
                    if (id && ctx.attemptsMap[id])
                        delete (ctx.attemptsMap as any)[id];
                    try {
                        ctx.inFlightManager.resolveIfMatches(id);
                    } catch (_) {}
                } catch (_) {}
                await handleCardSuccess(m, {
                    queueApi: ctx.queueApi,
                    tempMap: ctx.tempMap,
                });
            } else if (payloadObj?.list) {
                try {
                    const id = payloadObj.list.id as string | undefined;
                    if (id && ctx.attemptsMap[id])
                        delete (ctx.attemptsMap as any)[id];
                    try {
                        ctx.inFlightManager.resolveIfMatches(id);
                    } catch (_) {}
                } catch (_) {}
                await handleListSuccess(m, {
                    queueApi: ctx.queueApi,
                    tempMap: ctx.tempMap,
                });
            } else if (payloadObj?.board) {
                try {
                    const id = payloadObj.board.id as string | undefined;
                    if (id && ctx.attemptsMap[id])
                        delete (ctx.attemptsMap as any)[id];
                    try {
                        ctx.inFlightManager.resolveIfMatches(id);
                    } catch (_) {}
                } catch (_) {}
                await handleBoardSuccess(m, {
                    queueApi: ctx.queueApi,
                    tempMap: ctx.tempMap,
                });
            } else {
                await handleActionSuccess(m, {
                    queueApi: ctx.queueApi,
                    tempMap: ctx.tempMap,
                });
            }
        } catch (e) {
            safeCaptureException(e as Error);
        }
        return;
    }

    if (type === 'ERROR' || type === 'ACTION_ERROR') {
        const err: any = {
            timestamp: hasTimestampProp(payload)
                ? (payload as { timestamp: number }).timestamp
                : Date.now(),
            message:
                (error as Error | undefined)?.message || 'Unknown sync error',
            actionType: hasTypeProp(payload)
                ? (payload as { type: string }).type
                : undefined,
            payload: isObject(payload)
                ? (payload as Record<string, unknown>)
                : undefined,
        };
        if (ctx.syncError?.addError) ctx.syncError.addError(err);
        try {
            safeCaptureException(error as Error);
        } catch (e) {
            console.error(
                '[WorkerMessageHandler] Worker error (fallback):',
                error,
                payload
            );
        }
        return;
    }

    try {
        let respId: string | undefined;
        if (payload && hasTempId(payload)) respId = payload.tempId;
        else if (payload && isObject(payload)) {
            if (hasCardProp(payload) && isBoardCardLike(payload.card))
                respId = payload.card.id;
            else if (hasListProp(payload) && isBoardListLike(payload.list))
                respId = payload.list.id;
            else if (hasBoardProp(payload) && isBoardLike(payload.board))
                respId = payload.board.id;
            else if (
                hasIdProp(payload) &&
                typeof (payload as { id: unknown }).id === 'string'
            )
                respId = (payload as { id: string }).id;
        }

        try {
            const resolved = ctx.inFlightManager.resolveIfMatches(respId);
            if (resolved) return;
        } catch (err) {
            /* ignore */
        }
    } catch (err) {
        console.debug(
            '[WorkerMessageHandler] error resolving in-flight promise',
            err
        );
    }
}
