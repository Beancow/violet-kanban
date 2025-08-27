import IDBWrapper from '@/utils/idbWrapper';

const STORE_NAME = 'boards';

export type BoardRecord = {
    id: string;
    organizationId: string;
    title: string;
    lists?: string[];
    cards?: string[];
    updatedAt?: string;
    rev?: number;
    [k: string]: any;
};

const idb = new IDBWrapper('violet-kanban-idb', 1, [
    {
        name: STORE_NAME,
        options: { keyPath: 'id' },
        indexes: [{ name: 'organizationId', keyPath: 'organizationId' }],
    },
]);

export class BoardStore {
    static async getAll(orgId: string): Promise<BoardRecord[]> {
        try {
            const res = await idb.getByIndex(
                STORE_NAME,
                'organizationId',
                orgId
            );
            return Array.isArray(res) ? res : [];
        } catch (e) {
            console.error('[BoardStore] getAll failed', e);
            return [];
        }
    }

    static async get(id: string): Promise<BoardRecord | null> {
        try {
            const res = await idb.get(STORE_NAME, id);
            return res ?? null;
        } catch (e) {
            console.error('[BoardStore] get failed', e);
            return null;
        }
    }

    static async put(board: BoardRecord): Promise<void> {
        try {
            await idb.put(STORE_NAME, board);
        } catch (e) {
            console.error('[BoardStore] put failed', e);
        }
    }

    static async delete(id: string): Promise<void> {
        try {
            await idb.delete(STORE_NAME, id);
        } catch (e) {
            console.error('[BoardStore] delete failed', e);
        }
    }

    static async clearForOrg(orgId: string): Promise<void> {
        try {
            const existing = await BoardStore.getAll(orgId);
            await Promise.all(
                existing.map((b) => idb.delete(STORE_NAME, b.id))
            );
        } catch (e) {
            console.error('[BoardStore] clearForOrg failed', e);
        }
    }
}

export default BoardStore;
