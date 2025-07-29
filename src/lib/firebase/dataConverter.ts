import {
    FirestoreDataConverter,
    DocumentData,
    QueryDocumentSnapshot,
} from 'firebase/firestore';
import * as sentry from '@sentry/nextjs';

export const dataConverter = <T>(): FirestoreDataConverter<T> => ({
    toFirestore(data: T): DocumentData {
        // Bit of defensive programming to ensure data is an object and also handle FormData
        if (data instanceof FormData) {
            let formDataObject: Record<string, any> = {};
            formDataObject = Object.fromEntries(data.entries());
            return { ...formDataObject };
        }
        if (data === null || data === undefined || !(data instanceof Object)) {
            throw new Error(
                'Data must be an object or an instance of FormData'
            );
        }
        return { ...data };
    },
    fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): T {
        const data = snapshot.data();
        sentry.captureMessage('Snapshot Data:' + JSON.stringify(data), {
            level: 'info',
        });
        return data as T;
    },
});
