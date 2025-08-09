'use server';

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

declare global {
    var firebaseAdminApp: admin.app.App | undefined;
}

console.log('firebase-admin-init.ts: Top level admin object:', admin);

let adminApp: admin.app.App | undefined;

function initializeAdminApp() {
    console.log('firebase-admin-init.ts: Inside initializeAdminApp. Admin object:', admin);
    console.log('firebase-admin-init.ts: admin.apps.length:', admin.apps.length);

    if (!global.firebaseAdminApp) {
        if (!admin.apps.length) {
            try {
                console.log('firebase-admin-init.ts: Attempting to initialize Firebase Admin SDK.');
                const serviceAccountPath = path.resolve(process.cwd(), 'src/lib/firebase/serviceAccountKey.json');
                console.log('firebase-admin-init.ts: serviceAccountPath:', serviceAccountPath);
                console.log('firebase-admin-init.ts: serviceAccountKey.json exists:', fs.existsSync(serviceAccountPath));

                const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

                global.firebaseAdminApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
                console.log('firebase-admin-init.ts: Firebase Admin SDK initialized successfully.');
            } catch (error) {
                console.error('firebase-admin-init.ts: Error initializing Firebase Admin SDK:', error);
                throw error; // Re-throw to indicate initialization failure
            }
        } else {
            global.firebaseAdminApp = admin.app(); // If already initialized
            console.log('firebase-admin-init.ts: Firebase Admin SDK already initialized.');
        }
    }
    adminApp = global.firebaseAdminApp;
    return adminApp;
}

export async function getAdminFirestore() {
    if (!adminApp) {
        initializeAdminApp();
    }
    return adminApp!.firestore();
}

export async function getAdminAuth() {
    if (!adminApp) {
        initializeAdminApp();
    }
    return adminApp!.auth();
}