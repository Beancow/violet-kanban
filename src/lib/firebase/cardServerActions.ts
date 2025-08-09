'use server';
import { revalidatePath } from 'next/cache';
import { BoardCard, CreateCardResult } from '@/types/appState.type';
import { adminDataConverter } from './adminDataConverter';

// Dynamic import for firebase-admin-init
const getAdminFirestore = async () => {
    const { getAdminFirestore } = await import('./firebase-admin-init');
    return getAdminFirestore();
};

export const createCardServerAction = async ({
    data,
    uid,
    orgId,
    boardId,
    listId,
    tempId,
}: {
    data: Omit<BoardCard, 'id'>;
    uid: string;
    orgId: string;
    boardId: string;
    listId: string;
    tempId: string;
}): Promise<CreateCardResult> => {
    const newTimeStamp = new Date();

    try {
        const adminFirestore = await getAdminFirestore();

        if (!orgId || !boardId || !listId || !uid) {
            const error = new Error('Missing required IDs for card creation.');
            return { success: false, error };
        }

        const cardCollectionRef = adminFirestore.collection(
            `organizations/${orgId}/boards/${boardId}/cards`
        );
        const newCardRef = cardCollectionRef.doc();

        const newCard: BoardCard = {
            ...data,
            id: newCardRef.id,
            ownerId: uid,
            createdAt: newTimeStamp,
            updatedAt: newTimeStamp,
        };

        await newCardRef.set(newCard);

        return {
            success: true,
            data: {
                tempId: tempId,
                card: newCard,
            },
        };
    } catch (error) {
        const errorType =
            error instanceof Error
                ? new Error('Failed to create card', { cause: error })
                : new Error('An unknown error occurred');
        return { success: false, error: errorType };
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

export const updateCardServerAction = async (
    orgId: string,
    boardId: string,
    cardId: string,
    data: Partial<BoardCard>
) => {
    try {
        const adminFirestore = await getAdminFirestore();
        const cardDocRef = adminFirestore.doc(
            `organizations/${orgId}/boards/${boardId}/cards/${cardId}`
        );
        await adminFirestore.updateDoc(cardDocRef, {
            ...data,
            updatedAt: adminFirestore.FieldValue.serverTimestamp(),
        });
        revalidatePath(`/board/${boardId}`);
        return { success: true };
    } catch (error) {
        console.error('Error updating card:', error);
        return { success: false };
    }
};
