import { emitEvent } from '@/utils/eventBusClient';

export type ActionSuccessCtx = {
    queueApi?: any;
    tempMap?: any;
};

async function maybeCanonicalizeTemp(
    payload: any,
    realId: string | undefined,
    ctx?: ActionSuccessCtx
) {
    try {
        if (!payload || !ctx || !realId) return;
        const t = payload?.tempId as string | undefined;
        if (!t) return;
        const current = await ctx.tempMap?.getRealId?.(t);
        if (current !== realId)
            emitEvent('tempid:set-request', { tempId: t, realId } as any);
    } catch (_) {}
}

// Focused handlers: caller (SyncOrchestrator) should decide which to call.
export async function handleCardSuccess(
    message: any,
    ctx?: ActionSuccessCtx
): Promise<boolean> {
    if (!message) return false;
    const { payload, queueItem } = message as any;
    try {
        const id = payload?.card?.id as string | undefined;
        await maybeCanonicalizeTemp(payload, id, ctx);
        try {
            emitEvent('reconciliation:request', { payload, queueItem } as any);
        } catch (_) {}
        try {
            if (id)
                ctx?.queueApi?.enqueueCardAction?.({
                    type: 'RECONCILE_CARD',
                    payload: { id },
                    timestamp: Date.now(),
                } as any);
        } catch (_) {}
        return true;
    } catch (e) {
        return true;
    }
}

export async function handleListSuccess(
    message: any,
    ctx?: ActionSuccessCtx
): Promise<boolean> {
    if (!message) return false;
    const { payload, queueItem } = message as any;
    try {
        const id = payload?.list?.id as string | undefined;
        await maybeCanonicalizeTemp(payload, id, ctx);
        try {
            emitEvent('reconciliation:request', { payload, queueItem } as any);
        } catch (_) {}
        try {
            if (id)
                ctx?.queueApi?.enqueueListAction?.({
                    type: 'RECONCILE_LIST',
                    payload: { id },
                    timestamp: Date.now(),
                } as any);
        } catch (_) {}
        return true;
    } catch (e) {
        return true;
    }
}

export async function handleBoardSuccess(
    message: any,
    ctx?: ActionSuccessCtx
): Promise<boolean> {
    if (!message) return false;
    const { payload, queueItem } = message as any;
    try {
        const id = payload?.board?.id as string | undefined;
        await maybeCanonicalizeTemp(payload, id, ctx);
        try {
            // remove any pending queue item for this board (cleanup)
            if (id) {
                try {
                    ctx?.queueApi?.removeBoardAction?.(id);
                } catch (_) {}
            }
        } catch (_) {}
        try {
            emitEvent('reconciliation:request', { payload, queueItem } as any);
        } catch (_) {}
        try {
            if (id)
                ctx?.queueApi?.enqueueBoardAction?.({
                    type: 'RECONCILE_BOARD',
                    payload: { id },
                    timestamp: Date.now(),
                } as any);
        } catch (_) {}
        return true;
    } catch (e) {
        return true;
    }
}

// Backwards-compatible default: noop dispatcher (keeps callers safe). Prefer calling specific handlers.
export default async function handleActionSuccess(
    _message: any,
    _ctx?: ActionSuccessCtx
): Promise<boolean> {
    // Keep compatibility but prefer callers to use the specific handlers above.
    return true;
}
