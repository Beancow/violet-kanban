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
        if (data === null || data === undefined || typeof data !== 'object') {
            throw new Error('Data must be a plain object');
        }
        // Shallow-copy to a plain object
        return Object.assign({}, data) as AdminDocumentData;
    },
    fromFirestore(snapshot: AdminQueryDocumentSnapshot): T {
        const data = snapshot.data();
        const convertedData: AdminDocumentData = { ...data, id: snapshot.id };

        // Convert Firestore Timestamp-like objects to ISO strings when detected.
        for (const key of Object.keys(convertedData)) {
            const val = convertedData[key];
            if (val && typeof val === 'object') {
                const v = val as { toDate?: unknown };
                if (typeof v.toDate === 'function') {
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                        convertedData[key] = (
                            v.toDate as () => Date
                        )().toISOString();
                    } catch (_) {
                        // leave original value
                    }
                }
            }
        }

        // Treat convertedData as the target shape after normalization
        return convertedData as T;
    },
});
