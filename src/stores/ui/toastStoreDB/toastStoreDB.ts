import IDBWrapper from '@/utils/idbWrapper';

const STORE_NAME = 'toasts';

const idb = new IDBWrapper('violet-kanban-idb', 1, [
  { name: STORE_NAME, options: { keyPath: 'id' } },
]);

export type ToastRecord = {
  id: string;
  message: string;
  level?: 'info' | 'error' | 'success' | 'warning';
  createdAt: string;
};

export class ToastStoreDB {
  static async put(t: ToastRecord): Promise<void> {
    try {
      await idb.put(STORE_NAME, t);
    } catch (e) {
      console.error('[ToastStoreDB] put failed', e);
    }
  }

  static async getAll(): Promise<ToastRecord[]> {
    try {
      const res = await idb.getAll(STORE_NAME);
      return Array.isArray(res) ? res : [];
    } catch (e) {
      console.error('[ToastStoreDB] getAll failed', e);
      return [];
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await idb.delete(STORE_NAME, id);
    } catch (e) {
      console.error('[ToastStoreDB] delete failed', e);
    }
  }
}

export default ToastStoreDB;
