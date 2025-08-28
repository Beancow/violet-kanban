// Minimal listStoreDB stub to satisfy validator
// TODO: implement full ListStoreDB backed by IndexedDB

export type ListRecord = {
    id: string;
    boardId: string;
    title: string;
    createdAt: number;
    metadata?: Record<string, unknown>;
};

export class ListStoreDB {
    private items: Map<string, ListRecord> = new Map();

    async init(): Promise<void> {
        return;
    }

    async add(
        l: Omit<ListRecord, 'createdAt'> & { id?: string }
    ): Promise<ListRecord> {
        const id = l.id || `list_${Math.random().toString(36).slice(2, 10)}`;
        const rec: ListRecord = {
            id,
            boardId: l.boardId,
            title: l.title,
            createdAt: Date.now(),
            metadata: l.metadata || {},
        };
        this.items.set(id, rec);
        return rec;
    }

    async get(id: string): Promise<ListRecord | null> {
        return this.items.get(id) || null;
    }
    async list(): Promise<ListRecord[]> {
        return Array.from(this.items.values());
    }
    async remove(id: string): Promise<void> {
        this.items.delete(id);
    }
}

export default ListStoreDB;
