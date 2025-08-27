import { scheduleNextAttempt } from '@/providers/helpers';

export default function applyBackoffAndPersist(
    qid: string | undefined,
    inFlightMeta: any,
    attemptsMap: Record<string, any>,
    queueApi?: any,
    err?: Error
) {
    const currentMeta = (inFlightMeta as any) || {};
    const updatedMeta = scheduleNextAttempt(currentMeta, err);
    if (qid) {
        attemptsMap[qid] = {
            attempts: updatedMeta.attempts ?? 0,
            nextAttemptAt:
                typeof updatedMeta.nextAttemptAt === 'number'
                    ? (updatedMeta.nextAttemptAt as number)
                    : null,
            lastError:
                typeof updatedMeta.lastError === 'string'
                    ? (updatedMeta.lastError as string)
                    : undefined,
        };
        try {
            if (queueApi && (queueApi as any).updateQueueMeta) {
                (queueApi as any).updateQueueMeta(qid, updatedMeta);
            }
        } catch (_) {}
    }
    return updatedMeta;
}
