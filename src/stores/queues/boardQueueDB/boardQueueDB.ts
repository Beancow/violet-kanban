import IDBWrapper from '@/utils/idbWrapper';

const STORE_NAME = 'boardQueue';

const idb = new IDBWrapper('violet-kanban-idb', 1, [
  { name: STORE_NAME, options: { keyPath: 'id' } },
]);

export type BoardQueueItem = {
  id: string;
  actionType: string;
  payload: unknown;
  meta: { createdAt: string; retryCount?: number; lastAttempt?: number | null };
};

export class BoardQueueDB {
  static async put(item: BoardQueueItem): Promise<void> {
    try {
      await idb.put(STORE_NAME, item);
    } catch (e) {
      console.error('[BoardQueueDB] put failed', e);
    }
  }

  static async getAll(): Promise<BoardQueueItem[]> {
    try {
      const res = await idb.getAll(STORE_NAME);
      return Array.isArray(res) ? res : [];
    } catch (e) {
      console.error('[BoardQueueDB] getAll failed', e);
      return [];
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await idb.delete(STORE_NAME, id);
    } catch (e) {
      console.error('[BoardQueueDB] delete failed', e);
    }
  }
}

export default BoardQueueDB;
