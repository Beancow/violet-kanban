export type QueueItemMeta = {
    id: string; // unique id for the queued item
    type: 'board' | 'list' | 'card';
    createdAt: number;
    retryCount?: number;
    lastAttempt?: number | null;
    attempts?: number;
};

export type QueueActionPayload = {
    actionType: string;
    payload: unknown;
};

export type QueueItem = {
    meta: QueueItemMeta;
    action: QueueActionPayload;
};

export type QueueStoreApi = {
    add(item: QueueItem): Promise<void>;
    getNext(type?: 'board' | 'list' | 'card'): Promise<QueueItem | undefined>;
    remove(id: string): Promise<void>;
    incRetry(id: string): Promise<void>;
    getAll(type?: 'board' | 'list' | 'card'): Promise<QueueItem[]>;
    clear(): Promise<void>;
};
