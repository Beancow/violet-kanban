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
        if (data === null || data === undefined || !(data instanceof Object)) {
            throw new Error(
                'Data must be an object or an instance of FormData'
            );
        }
        return { ...data };
    },
    fromFirestore(snapshot: AdminQueryDocumentSnapshot): Promise<T> {
        const data = snapshot.data();
        const convertedData = { ...data, id: snapshot.id } as T;

        // Convert Firestore Timestamps to ISO strings
        for (const key in convertedData) {
            if (convertedData[key] && typeof convertedData[key] === 'object' && convertedData[key].toDate) {
                convertedData[key] = convertedData[key].toDate().toISOString();
            }
        }
        return convertedData;
    },
});
