import type WorkerPoster from '@/services/workers/workerPoster';

export default async function postAndAwait(
    inFlightManager: any,
    workerPoster: InstanceType<typeof WorkerPoster>,
    actionId: string | undefined,
    actionToPost: Record<string, unknown>,
    timeoutMs = 30_000
) {
    const promise = inFlightManager.start(actionId, timeoutMs);
    await workerPoster.post(actionToPost as any);
    await promise;
}
