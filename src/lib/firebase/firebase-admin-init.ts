'use node';
'use server';

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let adminApp: admin.app.App | undefined;

function initializeAdminApp() {
    if (!adminApp) {
        if (!admin.apps.length) {
            try {
                // Explicitly read and parse the service account key
                const serviceAccountPath = path.resolve(process.cwd(), 'src/lib/firebase/serviceAccountKey.json');
                const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

                adminApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
                console.log('Firebase Admin SDK initialized successfully.');
            } catch (error) {
                console.error('Error initializing Firebase Admin SDK:', error);
                throw error; // Re-throw to indicate initialization failure
            }
        } else {
            adminApp = admin.app(); // If already initialized
            console.log('Firebase Admin SDK already initialized.');
        }
    }
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
