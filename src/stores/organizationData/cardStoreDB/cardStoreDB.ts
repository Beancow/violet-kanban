// Minimal cardStoreDB stub
export class CardStoreDB {
    private items = new Map();

    async init() {
        return;
    }
    async add(card: { id?: string; title: string; listId?: string }) {
        const id = card.id || `card_${Math.random().toString(36).slice(2, 10)}`;
        const rec = {
            id,
            title: card.title,
            listId: card.listId || null,
            createdAt: Date.now(),
        };
        this.items.set(id, rec);
        return rec;
    }
    async get(id: string) {
        return this.items.get(id) || null;
    }
    async list() {
        return Array.from(this.items.values());
    }
    async remove(id: string) {
        this.items.delete(id);
    }
}

export default CardStoreDB;
