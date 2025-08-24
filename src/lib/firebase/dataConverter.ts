import {
    FirestoreDataConverter,
    DocumentData,
    QueryDocumentSnapshot,
} from 'firebase/firestore';
// Avoid importing server-side Sentry wrapper into client-side hot paths.
// Use console.debug here instead of Sentry.captureMessage to prevent any
// accidental bundling or no-op overhead in client bundles.

export const dataConverter = <T>(): FirestoreDataConverter<T> => ({
    toFirestore(data: T): DocumentData {
        // Bit of defensive programming to ensure data is an object and also handle FormData
        if (data instanceof FormData) {
            let formDataObject: Record<string, unknown> = {};
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
        // Use console.debug for snapshot logging in client-side converters.
        // Sentry is intentionally not imported here (server-only reporting
        // should be done from server-side code paths).
        console.debug('Snapshot Data:', data);
        return data as T;
    },
});
