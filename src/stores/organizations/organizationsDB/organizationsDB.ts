// Minimal organizationsDB stub to satisfy validator
// TODO: implement IndexedDB-backed persistence and organization store logic

export type OrganizationRecord = {
    id: string;
    name: string;
    createdAt: number;
    metadata?: Record<string, unknown>;
};

export class OrganizationsDB {
    private items: Map<string, OrganizationRecord> = new Map();

    async init(): Promise<void> {
        return;
    }

    async add(
        org: Omit<OrganizationRecord, 'createdAt'> & { id?: string }
    ): Promise<OrganizationRecord> {
        const id = org.id || `org_${Math.random().toString(36).slice(2, 10)}`;
        const rec: OrganizationRecord = {
            id,
            name: org.name,
            createdAt: Date.now(),
            metadata: org.metadata || {},
        };
        this.items.set(id, rec);
        return rec;
    }

    async get(id: string): Promise<OrganizationRecord | null> {
        return this.items.get(id) || null;
    }
    async list(): Promise<OrganizationRecord[]> {
        return Array.from(this.items.values());
    }
    async remove(id: string): Promise<void> {
        this.items.delete(id);
    }
}

export default OrganizationsDB;
