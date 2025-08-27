import { SyncError, makeSyncError, NewSyncError } from '@/types/syncError';

// Minimal in-memory scaffold for SyncErrorStoreDB. This follows the
// DEV_GUIDELINES naming and will be replaced by a IndexedDB-backed
// implementation later. Keep methods small and explicit.

export class SyncErrorStoreDB {
  private items: Map<string, SyncError> = new Map();

  async addError(input: NewSyncError): Promise<SyncError> {
    const e = makeSyncError(input);
    this.items.set(e.id, e);
    return e;
  }

  async listErrors(): Promise<SyncError[]> {
    return Array.from(this.items.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  async removeError(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  async incrementRetry(id: string): Promise<SyncError | undefined> {
    const e = this.items.get(id);
    if (!e) return undefined;
    e.retryCount = (e.retryCount || 0) + 1;
    e.lastAttempt = Date.now();
    this.items.set(id, e);
    return e;
  }
}

export default SyncErrorStoreDB;
import IDBWrapper from '@/utils/idbWrapper';
import { SyncErrorRecord } from '@/types/syncError';

const STORE_NAME = 'syncErrors';

const idb = new IDBWrapper('violet-kanban-idb', 1, [
  { name: STORE_NAME, options: { keyPath: 'id' } },
]);

export class SyncErrorDB {
  static async put(rec: SyncErrorRecord): Promise<void> {
    try {
      await idb.put(STORE_NAME, rec);
    } catch (e) {
      console.error('[SyncErrorDB] put failed', e);
    }
  }

  static async getAll(): Promise<SyncErrorRecord[]> {
    try {
      const res = await idb.getAll(STORE_NAME);
      return Array.isArray(res) ? res : [];
    } catch (e) {
      console.error('[SyncErrorDB] getAll failed', e);
      return [];
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await idb.delete(STORE_NAME, id);
    } catch (e) {
      console.error('[SyncErrorDB] delete failed', e);
    }
  }
}

export default SyncErrorDB;
