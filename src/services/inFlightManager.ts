import { isObject, isStringId } from '@/types/typeGuards';

export class InFlightManager {
    private currentId: string | null = null;
    private resolveFn: (() => void) | null = null;
    private rejectFn: ((e?: any) => void) | null = null;
    private timeoutId: number | undefined;
    private waiting = false;

    get id() {
        return this.currentId ?? undefined;
    }

    get isWaiting() {
        return this.waiting;
    }

    start(id?: string, timeoutMs = 30_000) {
        if (this.waiting) throw new Error('in-flight already active');
        this.currentId = id ?? null;
        this.waiting = true;
        const p = new Promise<void>((resolve, reject) => {
            this.resolveFn = () => {
                try {
                    resolve();
                } finally {
                    this.clear();
                }
            };
            this.rejectFn = (e?: any) => {
                try {
                    reject(e);
                } finally {
                    this.clear();
                }
            };
        });
        try {
            this.timeoutId = window.setTimeout(() => {
                if (this.rejectFn)
                    this.rejectFn(new Error('sync message timeout'));
            }, timeoutMs) as unknown as number;
        } catch (_) {
            // ignore (tests may run in non-window env)
        }
        return p;
    }

    resolveIfMatches(respId?: string) {
        try {
            if (!this.waiting) return false;
            // If currentId is not set, we operate in optimistic mode and
            // resolve on any incoming response.
            if (!this.currentId) {
                if (this.resolveFn) this.resolveFn();
                return true;
            }
            // Defensive: ensure respId is a string-like id before comparing.
            if (isStringId(respId) && respId === this.currentId) {
                if (this.resolveFn) this.resolveFn();
                return true;
            }
            // Also support cases where a response object was provided
            // (e.g., m.payload) by accepting an object with id/tempId props.
            if (isObject(respId as any)) {
                const maybe = respId as any;
                if (isStringId(maybe.id) && maybe.id === this.currentId) {
                    if (this.resolveFn) this.resolveFn();
                    return true;
                }
                if (
                    isStringId(maybe.tempId) &&
                    maybe.tempId === this.currentId
                ) {
                    if (this.resolveFn) this.resolveFn();
                    return true;
                }
            }
        } catch (_) {}
        return false;
    }

    cancel() {
        if (this.rejectFn) this.rejectFn(new Error('sync cancelled'));
        else this.clear();
    }

    clear() {
        try {
            if (this.timeoutId) window.clearTimeout(this.timeoutId as number);
        } catch (_) {}
        this.timeoutId = undefined;
        this.currentId = null;
        this.resolveFn = null;
        this.rejectFn = null;
        this.waiting = false;
    }
}

export default InFlightManager;
