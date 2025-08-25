'use server';

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { fetchServiceAccountFromSecretManager } from './secretManager';

declare global {
    var firebaseAdminApp: admin.app.App | undefined;
}

let adminApp: admin.app.App | undefined;

/**
 * Initialize the Firebase Admin app.
 * Preference order:
 * 1. secret manager abstraction (async)
 * 2. FIREBASE_SERVICE_ACCOUNT env var (JSON)
 * 3. FIREBASE_SERVICE_ACCOUNT_BASE64 env var (base64-encoded JSON)
 * 4. Local file (only for local development)
 */
export async function initializeAdminApp() {
    if (global.firebaseAdminApp) {
        adminApp = global.firebaseAdminApp;
        return adminApp;
    }

    if (admin.apps.length) {
        global.firebaseAdminApp = admin.app();
        adminApp = global.firebaseAdminApp;
        return adminApp;
    }

    try {
        // 1) Try secret manager abstraction
        const secret = await fetchServiceAccountFromSecretManager();
        let serviceAccount: admin.ServiceAccount | null = null;

        if (secret) {
            try {
                serviceAccount = JSON.parse(secret) as admin.ServiceAccount;
            } catch (_err) {
                // Surface minimal message and reference error message only (no stack)
                console.error(
                    'firebase-admin-init: failed to parse service account from secret manager'
                );
                try {
                    console.debug(
                        'firebase-admin-init: parse error:',
                        (_err as Error)?.message
                    );
                } catch {
                    /* ignore */
                }
            }
        }

        // 2) Try env vars
        if (!serviceAccount) {
            const envJson = process.env.FIREBASE_SERVICE_ACCOUNT || null;
            const envBase64 =
                process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || null;

            if (envJson) {
                try {
                    serviceAccount = JSON.parse(
                        envJson
                    ) as admin.ServiceAccount;
                } catch (_err) {
                    console.error(
                        'firebase-admin-init: failed to parse FIREBASE_SERVICE_ACCOUNT env var'
                    );
                    try {
                        console.debug(
                            'firebase-admin-init: parse error:',
                            (_err as Error)?.message
                        );
                    } catch {
                        /* ignore */
                    }
                }
            } else if (envBase64) {
                try {
                    const decoded = Buffer.from(envBase64, 'base64').toString(
                        'utf8'
                    );
                    serviceAccount = JSON.parse(
                        decoded
                    ) as admin.ServiceAccount;
                } catch (_err) {
                    console.error(
                        'firebase-admin-init: failed to decode/parse FIREBASE_SERVICE_ACCOUNT_BASE64 env var'
                    );
                    try {
                        console.debug(
                            'firebase-admin-init: decode/parse error:',
                            (_err as Error)?.message
                        );
                    } catch {
                        /* ignore */
                    }
                }
            }
        }

        // 3) Fallback to local file only for local development
        if (!serviceAccount) {
            const serviceAccountPath = path.resolve(
                process.cwd(),
                'src/lib/firebase/serviceAccountKey.json'
            );
            if (!fs.existsSync(serviceAccountPath)) {
                throw new Error(
                    'serviceAccountKey.json not found and no service account present in env/secret manager'
                );
            }
            serviceAccount = JSON.parse(
                fs.readFileSync(serviceAccountPath, 'utf8')
            ) as admin.ServiceAccount;
        }

        global.firebaseAdminApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        adminApp = global.firebaseAdminApp;
        return adminApp;
    } catch (error) {
        const msg =
            error && (error as Error).message
                ? (error as Error).message
                : String(error);
        console.error(
            'firebase-admin-init: Error initializing Firebase Admin SDK:',
            msg
        );
        throw error;
    }
}

export async function getAdminFirestore() {
    if (!adminApp) await initializeAdminApp();
    return adminApp!.firestore();
}

export async function getAdminAuth() {
    if (!adminApp) await initializeAdminApp();
    return adminApp!.auth();
}
