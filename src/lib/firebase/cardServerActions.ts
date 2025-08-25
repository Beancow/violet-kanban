'use server';
import { revalidatePath } from 'next/cache';
import { BoardCard, CreateCardResult, User } from '@/types';
import { adminDataConverter } from './adminDataConverter';
import { FieldValue } from 'firebase-admin/firestore';

const getAdminFirestore = async () => {
    const { getAdminFirestore } = await import('./firebase-admin-init');
    return getAdminFirestore();
};

export const createCardServerAction = async ({
    data,
    user,
    orgId,
    listId,
    boardId,
}: {
    data: Omit<BoardCard, 'id'>;
    user: User;
    orgId: string;
    listId: string;
    boardId: string;
}): Promise<CreateCardResult> => {
    try {
        const adminFirestore = await getAdminFirestore();

        // Only require orgId, boardId, and user.id
        if (!orgId || !boardId || !user?.id) {
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
            listId,
            boardId,
            organizationId: orgId,
            createdAt: FieldValue.serverTimestamp().toString(),
            updatedAt: FieldValue.serverTimestamp().toString(),
            createdBy: {
                userId: user.id,
                name: user.name,
                email: user.email,
            },
        };
        console.log('new card created:', newCard);

        await newCardRef.set(newCard);

        return {
            success: true,
            data: {
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
        await cardDocRef.update({
            isDeleted: true,
            listId: null,
            updatedAt: FieldValue.serverTimestamp(),
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
        await cardDocRef.update({
            isDeleted: false,
            updatedAt: FieldValue.serverTimestamp(),
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
        await cardDocRef.update({
            listId: newListId,
            updatedAt: FieldValue.serverTimestamp(),
        });
        revalidatePath(`/board/${boardId}`);
        return { success: true };
    } catch (error) {
        console.error('Error moving card:', error);
        return { success: false };
    }
};

export async function getOrphanCardsByOrg(orgId: string) {
    try {
        const adminFirestore = await getAdminFirestore();
        const boardsSnapshot = await adminFirestore
            .collection(`organizations/${orgId}/boards`)
            .get();

        const orphanCards: BoardCard[] = [];

        for (const boardDoc of boardsSnapshot.docs) {
            const boardId = boardDoc.id;
            const cardsSnapshot = await adminFirestore
                .collection(`organizations/${orgId}/boards/${boardId}/cards`)
                .where('listId', '==', null)
                .where('boardId', '==', null)
                .withConverter(adminDataConverter<BoardCard>())
                .get();

            cardsSnapshot.forEach((cardDoc) => {
                orphanCards.push({
                    ...cardDoc.data(),
                    id: cardDoc.id,
                });
            });
        }

        return {
            success: true,
            data: orphanCards,
        };
    } catch (error) {
        console.error('Error fetching orphan cards:', error);
        return {
            success: false,
            error: new Error('Failed to fetch orphan cards', { cause: error }),
        };
    }
}
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
        const cardsCollectionRef = adminFirestore
            .collection(`organizations/${orgId}/boards/${boardId}/cards`)
            .withConverter(adminDataConverter<BoardCard>());
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

export const updateCardServerAction = async ({
    orgId,
    boardId,
    cardId,
    data,
}: {
    orgId: string;
    boardId: string;
    cardId: string;
    data: Partial<BoardCard>;
}) => {
    try {
        const adminFirestore = await getAdminFirestore();
        const cardDocRef = adminFirestore.doc(
            `organizations/${orgId}/boards/${boardId}/cards/${cardId}`
        );
        await cardDocRef.update({
            ...data,
            updatedAt: FieldValue.serverTimestamp(),
        });
        revalidatePath(`/board/${boardId}`);
        return { success: true };
    } catch (error) {
        console.error('Error updating card:', error);
        return { success: false };
    }
};
