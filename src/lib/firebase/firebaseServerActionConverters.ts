import { Organization } from '@/types/appState.type';
import { FirestoreDataConverter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

export const organizationConverter: FirestoreDataConverter<Organization> = {
    toFirestore(organization: Organization): DocumentData {
        return { ...organization };
    },
    fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): Organization {
        const data = snapshot.data();
        return data as Organization;
    },
};
