import IDBWrapper from '@/utils/idbWrapper';
import { QueueItem } from '@/types/queue';

const STORE_NAME = 'queue';

export type QueueRecord = {
    id: string;
    action: QueueItem['action'];
    meta: QueueItem['meta'];
};

const idb = new IDBWrapper('violet-kanban-idb', 1, [
    {
        name: STORE_NAME,
        options: { keyPath: 'id' },
        indexes: [{ name: 'byKind', keyPath: 'action.actionType' }],
    },
]);

export class QueueStore {
    private static subscribers: Set<(records: QueueRecord[]) => void> =
        new Set();
    private static BC_NAME = 'violet-kanban-queue';
    private static bc: BroadcastChannel | null =
        typeof BroadcastChannel !== 'undefined'
            ? new BroadcastChannel(QueueStore.BC_NAME)
            : null;

    private static async notifySubscribers() {
        try {
            const all = await QueueStore.getAll();
            for (const s of QueueStore.subscribers) {
                try {
                    s(all);
                } catch (_) {}
            }
        } catch (_) {}
    }

    static subscribe(fn: (records: QueueRecord[]) => void) {
        QueueStore.subscribers.add(fn);
        (async () => {
            try {
                const all = await QueueStore.getAll();
                try {
                    fn(all);
                } catch (_) {}
            } catch (_) {}
        })();
        return () => QueueStore.subscribers.delete(fn);
    }

    static async getAll(): Promise<QueueRecord[]> {
        try {
            const res = await idb.getAll(STORE_NAME);
            return Array.isArray(res) ? res : [];
        } catch (e) {
            console.error('[QueueStore] getAll failed', e);
            return [];
        }
    }

    static async get(id: string): Promise<QueueRecord | null> {
        try {
            const res = await idb.get(STORE_NAME, id);
            return res ?? null;
        } catch (e) {
            console.error('[QueueStore] get failed', e);
            return null;
        }
    }

    static async put(rec: QueueRecord): Promise<void> {
        try {
            await idb.put(STORE_NAME, rec);
            try {
                if (QueueStore.bc)
                    QueueStore.bc.postMessage({ type: 'PUT', id: rec.id });
            } catch (_) {}
            try {
                QueueStore.notifySubscribers();
            } catch (_) {}
        } catch (e) {
            console.error('[QueueStore] put failed', e);
        }
    }

    static async delete(id: string): Promise<void> {
        try {
            await idb.delete(STORE_NAME, id);
            try {
                if (QueueStore.bc)
                    QueueStore.bc.postMessage({ type: 'DELETE', id });
            } catch (_) {}
            try {
                QueueStore.notifySubscribers();
            } catch (_) {}
        } catch (e) {
            console.error('[QueueStore] delete failed', e);
        }
    }

    static async clear(): Promise<void> {
        try {
            await idb.clear(STORE_NAME);
            try {
                if (QueueStore.bc) QueueStore.bc.postMessage({ type: 'CLEAR' });
            } catch (_) {}
            try {
                QueueStore.notifySubscribers();
            } catch (_) {}
        } catch (e) {
            console.error('[QueueStore] clear failed', e);
        }
    }
}

export default QueueStore;
