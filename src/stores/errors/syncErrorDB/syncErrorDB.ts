import IDBWrapper from '@/utils/idbWrapper';
import {
    SyncError,
    makeSyncError,
    NewSyncError,
    SyncErrorRecord,
} from '@/types/syncError';

// IDB-backed SyncErrorStoreDB. Minimal public API used by orchestrator
// and job handlers. Keeps methods small and explicit per DEV_GUIDELINES.

const DB_NAME = 'violet-kanban-idb';
const DB_VERSION = 1;
const STORE_NAME = 'syncErrors';

const idb = new IDBWrapper(DB_NAME, DB_VERSION, [
    { name: STORE_NAME, options: { keyPath: 'id' } },
]);

// BroadcastChannel name for cross-tab notifications
const BC_NAME = 'violet-kanban:syncError';

export class SyncErrorStoreDB {
    private bc: BroadcastChannel | null = null;

    constructor() {
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                this.bc = new BroadcastChannel(BC_NAME);
            } catch (e) {
                this.bc = null;
            }
        }
    }

    private toRecord(e: SyncError): SyncErrorRecord {
        return {
            id: e.id,
            message: e.message,
            actionId: e.jobId,
            retryCount: e.retryCount,
            lastAttempt: e.lastAttempt ?? null,
            createdAt: new Date(e.createdAt).toISOString(),
        };
    }

    private fromRecord(r: SyncErrorRecord): SyncError {
        return {
            id: r.id,
            jobId: r.actionId,
            type: 'unknown',
            message: r.message,
            retryCount: r.retryCount ?? 0,
            lastAttempt:
                typeof r.lastAttempt === 'number'
                    ? r.lastAttempt
                    : r.lastAttempt
                    ? Date.parse(r.lastAttempt)
                    : undefined,
            createdAt:
                typeof r.createdAt === 'number'
                    ? r.createdAt
                    : Date.parse(r.createdAt),
        };
    }

    private broadcast(payload: {
        type: 'added' | 'removed' | 'updated';
        id: string;
    }): void {
        if (this.bc) {
            try {
                this.bc.postMessage(payload);
            } catch (e) {
                // ignore
            }
        }
    }

    async add(input: NewSyncError): Promise<SyncError> {
        const e = makeSyncError(input);
        const rec = this.toRecord(e);
        await idb.put(STORE_NAME, rec);
        this.broadcast({ type: 'added', id: e.id });
        return e;
    }

    async list(): Promise<SyncError[]> {
        try {
            const rows = await idb.getAll(STORE_NAME);
            const arr = Array.isArray(rows)
                ? rows.map((r) => this.fromRecord(r))
                : [];
            return arr.sort((a, b) => b.createdAt - a.createdAt);
        } catch (err) {
            console.error('[SyncErrorStoreDB] list failed', err);
            return [];
        }
    }

    async remove(id: string): Promise<boolean> {
        try {
            await idb.delete(STORE_NAME, id);
            this.broadcast({ type: 'removed', id });
            return true;
        } catch (err) {
            console.error('[SyncErrorStoreDB] remove failed', err);
            return false;
        }
    }

    async incrementRetry(id: string): Promise<SyncError | undefined> {
        try {
            const maybe = await idb.get(STORE_NAME, id);
            if (!maybe) return undefined;
            const rec: SyncErrorRecord = {
                id: maybe.id,
                message: maybe.message,
                actionId: maybe.actionId,
                retryCount: (maybe.retryCount ?? 0) + 1,
                lastAttempt: Date.now(),
                createdAt: maybe.createdAt,
            };
            await idb.put(STORE_NAME, rec);
            const updated = this.fromRecord(rec);
            this.broadcast({ type: 'updated', id });
            return updated;
        } catch (err) {
            console.error('[SyncErrorStoreDB] incrementRetry failed', err);
            return undefined;
        }
    }
}

export default SyncErrorStoreDB;
