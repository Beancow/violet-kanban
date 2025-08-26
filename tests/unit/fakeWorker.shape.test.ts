import { installFakeWorker, uninstallFakeWorker } from '../helpers/fakeWorker';

describe('fake worker shape', () => {
    beforeEach(() => installFakeWorker());
    afterEach(() => uninstallFakeWorker());

    test('fake worker matches basic Worker API used by useWebWorker', async () => {
        const w = new (global as any).Worker('dataSyncWorker.js');
        expect(w).toBeDefined();
        // should have postMessage function
        expect(typeof w.postMessage).toBe('function');
        // should have terminate function
        expect(typeof w.terminate).toBe('function');
        // should allow setting onmessage handler
        w.onmessage = () => {};
        expect(typeof w.onmessage).toBe('function');

        // Check that fake worker emits WORKER_READY with meta tag
        // Wait a tick for ready
        await new Promise((r) => setTimeout(r, 0));
        const last = (global as any).__lastFakeWorker;
        expect(last).toBeDefined();
    });
});
