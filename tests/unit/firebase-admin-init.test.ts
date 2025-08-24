import { jest } from '@jest/globals';

// Keep imports inside tests so mocks can be applied first
describe('firebase-admin-init initializeAdminApp', () => {
    const fakeServiceAccount = {
        projectId: 'test-project',
        clientEmail: 'x@test',
        privateKey: '---',
    };

    beforeEach(() => {
        jest.resetModules();
        // Ensure no env vars are set for the test
        delete process.env.FIREBASE_SERVICE_ACCOUNT;
        delete process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    });

    it('falls back to local serviceAccountKey.json when secret manager and env are absent', async () => {
        // Mock the secret manager module to return null
        jest.unstable_mockModule(
            '../../src/lib/firebase/secretManager',
            () => ({
                fetchServiceAccountFromSecretManager: async () => null,
            })
        );

        // Mock fs so the file exists and returns our fake JSON
        jest.unstable_mockModule('fs', () => ({
            existsSync: (p: string) => true,
            readFileSync: (p: string) => JSON.stringify(fakeServiceAccount),
        }));

        // Mock firebase-admin to provide credential helper; we will spy on initializeApp
        const mockCredential = { cert: (s: any) => ({ _cert: s }) };
        jest.unstable_mockModule('firebase-admin', () => ({
            apps: [] as any[],
            initializeApp: (opts: any) => ({ _app: true, opts }),
            credential: mockCredential,
        }));

        const { initializeAdminApp } = await import(
            '../../src/lib/firebase/firebase-admin-init'
        );
        // Import the real module reference so we can spy on it
        const admin = await import('firebase-admin');
        const spyInit = jest.spyOn(admin as any, 'initializeApp');
        const spyCert = jest.spyOn((admin as any).credential, 'cert');

        const adminApp = await initializeAdminApp();

        // verify firebase-admin.initializeApp was called and returned object matches our mock
        expect(spyInit).toHaveBeenCalled();
        expect(spyCert).toHaveBeenCalled();
        expect(adminApp).toBeDefined();
    });
});
