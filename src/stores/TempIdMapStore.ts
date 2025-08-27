import IDBWrapper from '@/utils/idbWrapper';

const STORE_NAME = 'tempidmap';

export type TempIdRecord = {
    tempId: string;
    realId: string;
    createdAt?: string;
};

const idb = new IDBWrapper('violet-kanban-idb', 1, [
    { name: STORE_NAME, options: { keyPath: 'tempId' } },
]);

export class TempIdMapStore {
    static async getAllKeys(): Promise<string[]> {
        try {
            const all = await idb.getAll(STORE_NAME);
            if (!Array.isArray(all)) return [];
            return all.map((r: any) => r.tempId).filter(Boolean);
        } catch (e) {
            console.error('[TempIdMapStore] getAllKeys failed', e);
            return [];
        }
    }

    static async getRealId(tempId: string): Promise<string | null> {
        try {
            const rec = await idb.get(STORE_NAME, tempId);
            return rec ? (rec as any).realId : null;
        } catch (e) {
            console.error('[TempIdMapStore] getRealId failed', e);
            return null;
        }
    }

    static async put(tempId: string, realId: string): Promise<void> {
        try {
            await idb.put(STORE_NAME, {
                tempId,
                realId,
                createdAt: new Date().toISOString(),
            });
        } catch (e) {
            console.error('[TempIdMapStore] put failed', e);
        }
    }

    static async delete(tempId: string): Promise<void> {
        try {
            await idb.delete(STORE_NAME, tempId);
        } catch (e) {
            console.error('[TempIdMapStore] delete failed', e);
        }
    }
}

export default TempIdMapStore;
