import IDBWrapper from '@/utils/idbWrapper';

const STORE_NAME = 'lists';

export type ListRecord = {
    id: string;
    boardId: string;
    organizationId: string;
    title: string;
    position: number;
    description?: string;
    updatedAt?: string;
    rev?: number;
    [k: string]: any;
};

const idb = new IDBWrapper('violet-kanban-idb', 1, [
    {
        name: STORE_NAME,
        options: { keyPath: 'id' },
        indexes: [
            { name: 'boardId', keyPath: 'boardId' },
            { name: 'organizationId', keyPath: 'organizationId' },
        ],
    },
]);

export class ListStore {
    static async getAllForBoard(boardId: string): Promise<ListRecord[]> {
        try {
            const res = await idb.getByIndex(STORE_NAME, 'boardId', boardId);
            return Array.isArray(res) ? res : [];
        } catch (e) {
            console.error('[ListStore] getAllForBoard failed', e);
            return [];
        }
    }

    static async getAllForOrg(orgId: string): Promise<ListRecord[]> {
        try {
            const res = await idb.getByIndex(
                STORE_NAME,
                'organizationId',
                orgId
            );
            return Array.isArray(res) ? res : [];
        } catch (e) {
            console.error('[ListStore] getAllForOrg failed', e);
            return [];
        }
    }

    static async get(id: string): Promise<ListRecord | null> {
        try {
            const res = await idb.get(STORE_NAME, id);
            return res ?? null;
        } catch (e) {
            console.error('[ListStore] get failed', e);
            return null;
        }
    }

    static async put(list: ListRecord): Promise<void> {
        try {
            await idb.put(STORE_NAME, list);
        } catch (e) {
            console.error('[ListStore] put failed', e);
        }
    }

    static async delete(id: string): Promise<void> {
        try {
            await idb.delete(STORE_NAME, id);
        } catch (e) {
            console.error('[ListStore] delete failed', e);
        }
    }

    static async clearForOrg(orgId: string): Promise<void> {
        try {
            const existing = await ListStore.getAllForOrg(orgId);
            await Promise.all(
                existing.map((l) => idb.delete(STORE_NAME, l.id))
            );
        } catch (e) {
            console.error('[ListStore] clearForOrg failed', e);
        }
    }
}

export default ListStore;
