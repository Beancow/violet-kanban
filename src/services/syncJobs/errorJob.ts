import { safeCaptureException } from '@/lib/sentryWrapper';
import { isObject, hasTimestampProp, hasTypeProp } from '@/types/typeGuards';

export type ErrorJobCtx = {
    syncError?: { addError?: (e: any) => void };
};

export default async function handleError(
    message: any,
    ctx?: ErrorJobCtx
): Promise<boolean> {
    try {
        const m = message as any;
        const { payload, error } = m || {};
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
        if (ctx?.syncError?.addError) {
            try {
                ctx.syncError.addError(err);
            } catch (_) {}
        }
        try {
            safeCaptureException(error as Error);
        } catch (e) {
            console.error(
                '[errorJob] Worker error (fallback):',
                error,
                payload
            );
        }
        return true;
    } catch (e) {
        // Never throw from a job handler — orchestrator should remain robust.
        try {
            safeCaptureException(e as Error);
        } catch (_) {}
        return false;
    }
}
