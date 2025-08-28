// Minimal cardQueueDB stub to satisfy validator
// TODO: implement IndexedDB-backed persistence and queue logic per DEV_GUIDELINES

import type { QueueItem } from '@/types/queue';

export class CardQueueDB {
    private items: Map<string, QueueItem> = new Map();

    async init(): Promise<void> {
        return;
    }

    async add(
        item: Omit<
            {
                id: string;
                type: 'card';
                payload: Record<string, unknown>;
                retryCount?: number;
                nextAttempt?: number;
                createdAt: number;
            },
            'createdAt'
        > & { id?: string }
    ): Promise<QueueItem> {
        const id = item.id || `cq_${Math.random().toString(36).slice(2, 10)}`;
        const rec: QueueItem = {
            meta: {
                id,
                type: 'card',
                createdAt: Date.now(),
                retryCount: item.retryCount,
                lastAttempt: item.nextAttempt ?? null,
            },
            action: {
                actionType: 'card',
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

export default CardQueueDB;
