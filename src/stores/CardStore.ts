import IDBWrapper from '@/utils/idbWrapper';

const STORE_NAME = 'cards';

export type CardRecord = {
    id: string;
    title: string;
    description?: string;
    listId?: string | null;
    boardId: string;
    organizationId: string;
    priority?: number;
    completed?: boolean;
    updatedAt?: string;
    rev?: number;
    [k: string]: any;
};

const idb = new IDBWrapper('violet-kanban-idb', 1, [
    {
        name: STORE_NAME,
        options: { keyPath: 'id' },
        indexes: [
            { name: 'listId', keyPath: 'listId' },
            { name: 'boardId', keyPath: 'boardId' },
            { name: 'organizationId', keyPath: 'organizationId' },
        ],
    },
]);

export class CardStore {
    static async getAllForBoard(boardId: string): Promise<CardRecord[]> {
        try {
            const res = await idb.getByIndex(STORE_NAME, 'boardId', boardId);
            return Array.isArray(res) ? res : [];
        } catch (e) {
            console.error('[CardStore] getAllForBoard failed', e);
            return [];
        }
    }

    static async getAllForList(listId: string): Promise<CardRecord[]> {
        try {
            const res = await idb.getByIndex(STORE_NAME, 'listId', listId);
            return Array.isArray(res) ? res : [];
        } catch (e) {
            console.error('[CardStore] getAllForList failed', e);
            return [];
        }
    }

    static async getAllForOrg(orgId: string): Promise<CardRecord[]> {
        try {
            const res = await idb.getByIndex(
                STORE_NAME,
                'organizationId',
                orgId
            );
            return Array.isArray(res) ? res : [];
        } catch (e) {
            console.error('[CardStore] getAllForOrg failed', e);
            return [];
        }
    }

    static async get(id: string): Promise<CardRecord | null> {
        try {
            const res = await idb.get(STORE_NAME, id);
            return res ?? null;
        } catch (e) {
            console.error('[CardStore] get failed', e);
            return null;
        }
    }

    static async put(card: CardRecord): Promise<void> {
        try {
            await idb.put(STORE_NAME, card);
        } catch (e) {
            console.error('[CardStore] put failed', e);
        }
    }

    static async delete(id: string): Promise<void> {
        try {
            await idb.delete(STORE_NAME, id);
        } catch (e) {
            console.error('[CardStore] delete failed', e);
        }
    }

    static async clearForOrg(orgId: string): Promise<void> {
        try {
            const existing = await CardStore.getAllForOrg(orgId);
            await Promise.all(
                existing.map((c) => idb.delete(STORE_NAME, c.id))
            );
        } catch (e) {
            console.error('[CardStore] clearForOrg failed', e);
        }
    }
}

export default CardStore;
