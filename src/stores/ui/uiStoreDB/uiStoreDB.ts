// Minimal uiStoreDB stub
export class UiStoreDB {
    private state = {};
    async init() {
        return;
    }
    async get(key: string) {
        return (this.state as any)[key];
    }
    async set(key: string, value: any) {
        (this.state as any)[key] = value;
    }
    async clear() {
        this.state = {};
    }
}

export default UiStoreDB;
