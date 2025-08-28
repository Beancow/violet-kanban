export type SyncManagerInFlightRef = {
    waiting: boolean;
    id?: string | undefined;
    promise?: Promise<void> | undefined;
    resolve?: (() => void) | undefined;
    timeout?: number | undefined;
    meta?: unknown;
};

export type SanitizerTuple = [Array<unknown> | undefined, (id: string) => void];

export default {} as const;
