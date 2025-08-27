import { emitEvent } from '@/utils/eventBusClient';
import { isObject, hasOrganizationId } from '@/types/typeGuards';

export type FreshTokenFn = () => Promise<string | null | undefined>;

export default class WorkerPoster {
    private postMessage: (m: any) => void;
    private getFreshToken: FreshTokenFn;
    private orgProvider?: { currentOrganizationId?: string | null } | undefined;

    constructor(opts: {
        postMessage: (m: any) => void;
        getFreshToken: FreshTokenFn;
        orgProvider?: { currentOrganizationId?: string | null } | undefined;
    }) {
        this.postMessage = opts.postMessage;
        this.getFreshToken = opts.getFreshToken;
        this.orgProvider = opts.orgProvider;
    }

    async post(action: Record<string, unknown>) {
        try {
            // If the caller already injected an idToken on the payload, don't
            // re-fetch. Otherwise await a fresh token from the injected
            // getFreshToken function so we always post with credentials when
            // available.
            const orgId = this.orgProvider?.currentOrganizationId;
            const originalPayload = isObject((action as any).payload)
                ? { ...((action as any).payload as Record<string, unknown>) }
                : {};

            // If there's no idToken on the payload, attempt to fetch one.
            let idToken = undefined as string | null | undefined;
            if (!(originalPayload as any).idToken) {
                try {
                    idToken = await this.getFreshToken();
                } catch (_) {
                    // swallow token fetch errors; posting should still occur
                    idToken = undefined;
                }
            }

            const payload = {
                ...originalPayload,
                ...(idToken ? { idToken } : {}),
                ...(orgId && !hasOrganizationId(originalPayload)
                    ? { organizationId: orgId }
                    : {}),
            } as Record<string, unknown>;

            const toSend = {
                ...(action as Record<string, unknown>),
                payload,
                timestamp: Date.now(),
            };

            // emit outgoing for dev panels
            emitEvent('worker:outgoing', toSend as any);

            // Post to worker. This function is async because it may await a
            // token; callers (SyncOrchestrator) already await post and will
            // therefore observe the asynchronous post deterministically.
            this.postMessage(toSend as any);
        } catch (e) {
            // rethrow so callers can handle
            throw e;
        }
    }
}
