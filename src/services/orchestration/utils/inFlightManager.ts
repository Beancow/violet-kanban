// Minimal inFlightManager stub
export class InFlightManager {
    private items = new Set();
    add(id: string) {
        this.items.add(id);
    }
    remove(id: string) {
        this.items.delete(id);
    }
    has(id: string) {
        return this.items.has(id);
    }
}

export default InFlightManager;
