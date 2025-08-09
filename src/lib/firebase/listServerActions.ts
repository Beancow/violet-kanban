'use server';
import { revalidatePath } from 'next/cache';
import { BoardList } from '@/types/appState.type';
import { adminDataConverter } from './adminDataConverter';
import * as sentry from '@sentry/nextjs';

// Dynamic import for firebase-admin-init
const getAdminFirestore = async () => {
    const { getAdminFirestore } = await import('./firebase-admin-init');
    return getAdminFirestore();
};

export async function getListServerAction(
    orgId: string,
    boardId: string,
    listId: string
) {
    try {
        const adminFirestore = await getAdminFirestore();
        const listCollectionRef = adminFirestore.doc(
            `organizations/${orgId}/boards/${boardId}/lists/${listId}`
        ).withConverter(adminDataConverter<BoardList>());

        const listDocs = await listCollectionRef.get();
        const listData = listDocs.data();

        if (!listData) {
            sentry.captureException(
                new Error(
                    `List with ID ${listId} not found in board ${boardId}`
                )
            );
            return {
                success: false,
                error: new Error('List not found'),
            };
        }
        return {
            success: true,
            data: listData,
        };
    } catch (error) {
        sentry.captureException(error);
        console.error('Error fetching list:', error);
        return {
            success: false,
            error: new Error('Failed to fetch list', { cause: error }),
        };
    }
}

export async function getListsServerAction({ orgId, boardId }: { orgId: string; boardId: string; }) {
    try {
        const adminFirestore = await getAdminFirestore();
        const listsCollection = adminFirestore.collection(
            `organizations/${orgId}/boards/${boardId}/lists`
        ).withConverter(adminDataConverter<BoardList>());

        const listsSnapshot = await listsCollection.get();
        const listsList: BoardList[] = listsSnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        }));
        sentry.captureMessage(
            `Fetched ${listsList.length} lists for board ${boardId}`
        );
        return {
            success: true,
            data: listsList,
        };
    } catch (error) {
        sentry.captureException(error);
        console.error('Error fetching lists:', error);
        return {
            success: false,
            error: new Error('Failed to fetch lists', { cause: error }),
        };
    }
}

export async function createListServerAction({
    data,
    uid,
    orgId,
    boardId,
    tempId,
}: {
    data: Omit<BoardList, 'id'>;
    uid: string;
    orgId: string;
    boardId: string;
    tempId: string;
}) {
    const creationDate = new Date();

    const list: Omit<BoardList, 'id'> = {
        ...data,
        boardId,
        createdAt: creationDate,
        updatedAt: creationDate,
    };
    try {
        const adminFirestore = await getAdminFirestore();
        const response = await adminFirestore.collection(
            `organizations/${orgId}/boards/${boardId}/lists`
        ).add({
            ...list,
        });

        const newList: BoardList = {
            ...list,
            id: response.id,
        };

        revalidatePath(`/board/${boardId}`); // Revalidate the board page to show new list
        return {
            success: true,
            data: {
                tempId,
                list: newList,
            },
        };
    } catch (error) {
        sentry.captureException(error);
        console.error('Error creating list:', error);
        return {
            success: false,
            error: new Error('Failed to create list', { cause: error }),
        };
    }
}

export async function deleteListServerAction(
    orgId: string,
    boardId: string,
    listId: string
) {
    const adminFirestore = await getAdminFirestore();
    const listRef = adminFirestore.doc(
        `organizations/${orgId}/boards/${boardId}/lists/${listId}`
    );
    const cardsRef = adminFirestore.collection(
        `organizations/${orgId}/boards/${boardId}/cards`
    );
    const q = cardsRef.where('listId', '==', listId);
    const batch = adminFirestore.batch();

    const cardsSnapshot = await q.get();
    cardsSnapshot.docs.forEach((cardDoc) => {
        const cardRef = adminFirestore.doc(
            `organizations/${orgId}/boards/${boardId}/cards/${cardDoc.id}`
        );
        batch.update(cardRef, { listId: null, updatedAt: adminFirestore.FieldValue.serverTimestamp() });
    });

    batch.delete(listRef);

    try {
        await batch.commit();
        revalidatePath(`/board/${boardId}`); // Revalidate the board page after deletion
        return { success: true };
    } catch (error) {
        sentry.captureException(error);
        console.error('Error deleting list:', error);
        return {
            success: false,
            error: new Error('Failed to delete list', { cause: error }),
        };
    }
}
