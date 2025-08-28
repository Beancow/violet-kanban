// Minimal boardStoreDB stub to satisfy validator
// TODO: implement full BoardStoreDB backed by IndexedDB

export type BoardRecord = {
    id: string;
    title: string;
    createdAt: number;
    metadata?: Record<string, unknown>;
};

export class BoardStoreDB {
    private items: Map<string, BoardRecord> = new Map();

    async init(): Promise<void> {
        return;
    }

    async add(
        b: Omit<BoardRecord, 'createdAt'> & { id?: string }
    ): Promise<BoardRecord> {
        const id = b.id || `board_${Math.random().toString(36).slice(2, 10)}`;
        const rec: BoardRecord = {
            id,
            title: b.title,
            createdAt: Date.now(),
            metadata: b.metadata || {},
        };
        this.items.set(id, rec);
        return rec;
    }

    async get(id: string): Promise<BoardRecord | null> {
        return this.items.get(id) || null;
    }
    async list(): Promise<BoardRecord[]> {
        return Array.from(this.items.values());
    }
    async remove(id: string): Promise<void> {
        this.items.delete(id);
    }
}

export default BoardStoreDB;
