'use server';

import * as sentry from '@sentry/nextjs';

// These interfaces are based on the Firebase Admin SDK for type safety in the server context.
interface AdminDocumentData {
    [field: string]: unknown;
}

interface AdminQueryDocumentSnapshot {
    id: string;
    data: () => AdminDocumentData;
}

interface AdminFirestoreDataConverter<T> {
    toFirestore(modelObject: T): AdminDocumentData;
    fromFirestore(snapshot: AdminQueryDocumentSnapshot): T;
}

export const adminDataConverter = <T>(): AdminFirestoreDataConverter<T> => ({
    toFirestore(data: T): AdminDocumentData {
        if (data instanceof FormData) {
            return Object.fromEntries(data.entries());
        }
        if (data === null || data === undefined || !(data instanceof Object)) {
            throw new Error(
                'Data must be an object or an instance of FormData'
            );
        }
        return { ...data };
    },
    fromFirestore(snapshot: AdminQueryDocumentSnapshot): T {
        const data = snapshot.data();
        sentry.captureMessage('Admin Snapshot Data:' + JSON.stringify(data), {
            level: 'info',
        });
        return { ...data, id: snapshot.id } as T;
    },
});
