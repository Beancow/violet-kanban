// Minimal IndexedDB wrapper used by stores.
// Lightweight, promise-based helper - intentionally small to avoid a new dependency.

export type StoreConfig = {
    name: string;
    options?: IDBObjectStoreParameters;
    indexes?: Array<{
        name: string;
        keyPath: string | string[];
        options?: IDBIndexParameters;
    }>;
};

async function openDB(dbName: string, version: number, stores: StoreConfig[]) {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const req = window.indexedDB.open(dbName, version);
        req.onupgradeneeded = (e) => {
            const db = req.result;
            try {
                for (const s of stores) {
                    if (!db.objectStoreNames.contains(s.name)) {
                        const os = db.createObjectStore(s.name, s.options);
                        if (s.indexes) {
                            for (const idx of s.indexes) {
                                try {
                                    os.createIndex(
                                        idx.name,
                                        idx.keyPath,
                                        idx.options
                                    );
                                } catch (_) {}
                            }
                        }
                    } else {
                        // ensure indexes exist
                        const os = (
                            req.transaction as IDBTransaction
                        ).objectStore(s.name);
                        if (s.indexes) {
                            for (const idx of s.indexes) {
                                if (!os.indexNames.contains(idx.name)) {
                                    try {
                                        os.createIndex(
                                            idx.name,
                                            idx.keyPath,
                                            idx.options
                                        );
                                    } catch (_) {}
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                // best-effort
                console.error('[idb] upgrade error', err);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function promisifyRequest<T>(req: IDBRequest<T> | IDBTransaction) {
    return new Promise<T>((resolve, reject) => {
        if ((req as IDBRequest).onsuccess !== undefined) {
            (req as IDBRequest).onsuccess = function (this: IDBRequest, ev) {
                resolve(this.result as T);
            };
            (req as IDBRequest).onerror = function (this: IDBRequest, ev) {
                reject(this.error);
            };
        } else {
            const tx = req as IDBTransaction;
            tx.oncomplete = () => resolve(undefined as unknown as T);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        }
    });
}

export class IDBWrapper {
    dbName: string;
    version: number;
    stores: StoreConfig[];
    dbPromise: Promise<IDBDatabase> | null = null;

    constructor(
        dbName = 'violet-kanban-idb',
        version = 1,
        stores: StoreConfig[] = []
    ) {
        this.dbName = dbName;
        this.version = version;
        this.stores = stores;
        if (typeof window !== 'undefined' && 'indexedDB' in window) {
            this.dbPromise = openDB(this.dbName, this.version, this.stores);
        }
    }

    async ready() {
        if (!this.dbPromise) throw new Error('IndexedDB not available');
        return this.dbPromise;
    }

    async getAll(storeName: string): Promise<any[]> {
        const db = await this.ready();
        const tx = db.transaction(storeName, 'readonly');
        const os = tx.objectStore(storeName);
        const req = os.getAll();
        return promisifyRequest<any[]>(req as IDBRequest<any[]>);
    }

    async getByIndex(
        storeName: string,
        indexName: string,
        query?: IDBValidKey | IDBKeyRange
    ): Promise<any[]> {
        const db = await this.ready();
        const tx = db.transaction(storeName, 'readonly');
        const os = tx.objectStore(storeName);
        const idx = os.index(indexName);
        const req = idx.getAll(query as any);
        return promisifyRequest<any[]>(req as IDBRequest<any[]>);
    }

    async get(storeName: string, key: IDBValidKey): Promise<any> {
        const db = await this.ready();
        const tx = db.transaction(storeName, 'readonly');
        const os = tx.objectStore(storeName);
        const req = os.get(key);
        return promisifyRequest<any>(req as IDBRequest<any>);
    }

    async put(storeName: string, value: any): Promise<void> {
        const db = await this.ready();
        const tx = db.transaction(storeName, 'readwrite');
        const os = tx.objectStore(storeName);
        os.put(value);
        return promisifyRequest(tx as IDBTransaction) as Promise<void>;
    }

    async delete(storeName: string, key: IDBValidKey): Promise<void> {
        const db = await this.ready();
        const tx = db.transaction(storeName, 'readwrite');
        const os = tx.objectStore(storeName);
        os.delete(key);
        return promisifyRequest(tx as IDBTransaction) as Promise<void>;
    }

    async clear(storeName: string): Promise<void> {
        const db = await this.ready();
        const tx = db.transaction(storeName, 'readwrite');
        const os = tx.objectStore(storeName);
        os.clear();
        return promisifyRequest(tx as IDBTransaction) as Promise<void>;
    }
}

export default IDBWrapper;
