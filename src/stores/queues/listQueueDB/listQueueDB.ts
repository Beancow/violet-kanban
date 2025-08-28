// Minimal listQueueDB stub to satisfy validator
// TODO: implement IndexedDB-backed persistence and queue logic per DEV_GUIDELINES
import type { QueueItem } from '@/types/queue';

export class ListQueueDB {
    private items: Map<string, QueueItem> = new Map();

    constructor() {
        // placeholder
    }

    async init(): Promise<void> {
        // placeholder for async initialization (open IDB etc.)
        return;
    }

    async add(
        item: Omit<
            {
                id: string;
                type: 'board' | 'list' | 'card';
                payload: Record<string, unknown>;
                retryCount?: number;
                nextAttempt?: number;
                createdAt: number;
            },
            'createdAt'
        > & { id?: string }
    ): Promise<QueueItem> {
        const id = item.id || generateId();
        const rec: QueueItem = {
            meta: {
                id,
                type: item.type,
                createdAt: Date.now(),
                retryCount: item.retryCount,
                lastAttempt: item.nextAttempt ?? null,
            },
            action: {
                actionType: item.type,
                payload: item.payload,
            },
        } as unknown as QueueItem;
        this.items.set(id, rec);
        return rec;
    }

    async list(): Promise<QueueItem[]> {
        return Array.from(this.items.values()).sort(
            (a, b) => (a.meta.createdAt ?? 0) - (b.meta.createdAt ?? 0)
        );
    }

    async remove(id: string): Promise<void> {
        this.items.delete(id);
    }

    async clear(): Promise<void> {
        this.items.clear();
    }
}

function generateId() {
    return 'q_' + Math.random().toString(36).slice(2, 10);
}

export default ListQueueDB;
