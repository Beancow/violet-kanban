'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { BoardCard } from '@/types/appState.type';
import { adminDataConverter } from './adminDataConverter';
import { FirebaseError } from 'firebase/app';

import { getOrganizationAction } from '@/lib/firebase/orgServerActions';

// Dynamic import for firebase-admin-init
const getAdminFirestore = async () => {
    const { getAdminFirestore } = await import('./firebase-admin-init');
    return getAdminFirestore();
};
const getAdminAuth = async () => {
    const { getAdminAuth } = await import('./firebase-admin-init');
    return getAdminAuth();
};

const CardSchema = z.object({
    title: z.string().min(1, { message: 'Title is required' }),
    description: z.string().optional(),
});

type CardResult = {
    success: boolean;
    data: BoardCard | null;
    error?: Error;
};

export const createCardServerAction = async ({
    data,
    idToken,
    orgId,
    boardId,
    listId,
}: {
    data: FormData;
    idToken: string;
    orgId: string;
    boardId: string;
    listId: string;
}): Promise<CardResult> => {
    const title = data.get('title') as string;
    const description = data.get('description') as string;

    const newTimeStamp = new Date();

    try {
        const adminAuth = await getAdminAuth();
        const adminFirestore = await getAdminFirestore();

        let uid: string;
        try {
            const decodedToken = await adminAuth.verifyIdToken(idToken);
            uid = decodedToken.uid;
            console.log('ID Token verified. UID:', uid);
        } catch (tokenError) {
            console.error('Error verifying ID Token:', tokenError);
            throw new Error('Invalid or expired authentication token.');
        }

        console.log('Creating card with the following details:');
        console.log('orgId:', orgId);
        console.log('boardId:', boardId);
        console.log('listId:', listId);
        console.log('uid:', uid);

        if (!orgId || !boardId || !listId || !uid) {
            const error = new Error('Missing required IDs for card creation.');
            console.error(error);
            return { success: false, data: null, error };
        }

        // Explicitly check organization existence and user membership
        const orgResult = await getOrganizationAction(orgId);
        if (!orgResult.success || !orgResult.data) {
            const error = new Error(
                `Organization ${orgId} not found or accessible.`
            );
            console.error(error);
            return { success: false, data: null, error };
        }

        if (!orgResult.data.members || !(uid in orgResult.data.members)) {
            const error = new Error(
                `User ${uid} is not a member of organization ${orgId}.`
            );
            console.error(error);
            return { success: false, data: null, error };
        }

        CardSchema.parse({ title, description });

        const cardCollectionRef = adminFirestore.collection(
            `organizations/${orgId}/boards/${boardId}/cards`
        ).withConverter(adminDataConverter<BoardCard>());

        const newCard: Omit<BoardCard, 'id'> = {
            title,
            boardId,
            completed: false,
            ownerId: uid,
            userId: uid,
            description,
            listId,
            createdAt: newTimeStamp,
            updatedAt: newTimeStamp,
        };

        const response = await adminFirestore.addDoc(cardCollectionRef, newCard);

        return {
            success: true,
            data: {
                id: response.id,
                ...newCard,
            },
        };
    } catch (error) {
        let errorType;
        if (error instanceof z.ZodError) {
            errorType = new Error('Validation errors:', { cause: error });
        }
        if (error instanceof Error)
            errorType = new Error('Failed to create card', { cause: error });
        if (error instanceof FirebaseError)
            errorType = new Error('Firebase error' + error.message, {
                cause: error,
            });
        console.error('Error creating card:', error);
        return { success: false, data: null, error: errorType };
    }
};

export const softDeleteCardServerAction = async (
    orgId: string,
    boardId: string,
    cardId: string
) => {
    try {
        const adminFirestore = await getAdminFirestore();
        const cardDocRef = adminFirestore.doc(
            `organizations/${orgId}/boards/${boardId}/cards/${cardId}`
        );
        await adminFirestore.updateDoc(cardDocRef, {
            isDeleted: true,
            listId: null,
            updatedAt: adminFirestore.FieldValue.serverTimestamp(),
        });
        revalidatePath(`/board/${boardId}`);
        return { success: true };
    } catch (error) {
        console.error('Error soft deleting card:', error);
        return { success: false };
    }
};

export const restoreCardServerAction = async (
    orgId: string,
    boardId: string,
    cardId: string
) => {
    try {
        const adminFirestore = await getAdminFirestore();
        const cardDocRef = adminFirestore.doc(
            `organizations/${orgId}/boards/${boardId}/cards/${cardId}`
        );
        await adminFirestore.updateDoc(cardDocRef, {
            isDeleted: false,
            updatedAt: adminFirestore.FieldValue.serverTimestamp(),
        });
        revalidatePath(`/board/${boardId}`);
        return { success: true };
    } catch (error) {
        console.error('Error restoring card:', error);
        return { success: false };
    }
};

export const updateCardListIdServerAction = async (
    orgId: string,
    boardId: string,
    cardId: string,
    newListId: string | null
) => {
    try {
        const adminFirestore = await getAdminFirestore();
        const cardDocRef = adminFirestore.doc(
            `organizations/${orgId}/boards/${boardId}/cards/${cardId}`
        );
        await adminFirestore.updateDoc(cardDocRef, {
            listId: newListId,
            updatedAt: adminFirestore.FieldValue.serverTimestamp(),
        });
        revalidatePath(`/board/${boardId}`);
        return { success: true };
    } catch (error) {
        console.error('Error moving card:', error);
        return { success: false };
    }
};

export async function getCardsServerAction({
    orgId,
    boardId,
}: {
    orgId: string;
    boardId: string;
}) {
    console.log(`Fetching cards for org: ${orgId}, board: ${boardId}`);
    try {
        const adminFirestore = await getAdminFirestore();
        const cardsCollectionRef = adminFirestore.collection(
            `organizations/${orgId}/boards/${boardId}/cards`
        ).withConverter(adminDataConverter<BoardCard>());
        const cardsSnapshot = await cardsCollectionRef.get();
        const cardsList: BoardCard[] = cardsSnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        }));
        return {
            success: true,
            data: cardsList,
        };
    } catch (error) {
        console.error('Error fetching cards:', error);
        return {
            success: false,
            error: new Error('Failed to fetch cards', { cause: error }),
        };
    }
}