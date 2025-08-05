import { firebaseDB } from '@/lib/firebase/firebase-config';
import { BoardList } from '@/types/appState.type';
import {
    getDocs,
    collection,
    getDoc,
    doc,
    addDoc,
    writeBatch,
    query,
    where,
    deleteField,
} from 'firebase/firestore';
import { dataConverter } from './dataConverter';
import * as sentry from '@sentry/nextjs';

export async function getListAction(
    orgId: string,
    boardId: string,
    listId: string
) {
    const listCollectionRef = doc(
        firebaseDB,
        `organizations/${orgId}/boards/${boardId}/lists/${listId}`
    ).withConverter(dataConverter<BoardList>());
    try {
        const listDocs = await getDoc(listCollectionRef);
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

export async function getListsAction(orgId: string, boardId: string) {
    const listsCollection = collection(
        firebaseDB,
        `organizations/${orgId}/boards/${boardId}/lists`
    ).withConverter(dataConverter<BoardList>());
    try {
        const listsSnapshot = await getDocs(listsCollection);
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

export async function createList({
    data,
    uid,
    orgId,
    boardId,
}: {
    data: FormData;
    uid: string;
    orgId: string;
    boardId: string;
}) {
    const title = data.get('title')?.valueOf();
    const description = data.get('description')?.valueOf();

    if (typeof title !== 'string' || typeof description !== 'string') {
        throw new Error('Invalid data');
    }

    const creationDate = new Date();

    const list = {
        title,
        description,
        position: 0,
        boardId,
        data: {
            isArchived: false,
            isDeleted: false,
            backgroundColor: '#ffffff',
            ownerId: uid,
        },
        createdAt: creationDate,
        updatedAt: creationDate,
    };

    const response = await addDoc(
        collection(
            firebaseDB,
            `organizations/${orgId}/boards/${boardId}/lists`
        ),
        {
            ...list,
        }
    );

    return {
        success: true,
        data: response,
    };
}

export async function deleteListAction(
    orgId: string,
    boardId: string,
    listId: string
) {
    const listRef = doc(
        firebaseDB,
        `organizations/${orgId}/boards/${boardId}/lists/${listId}`
    );
    const todosRef = collection(
        firebaseDB,
        `organizations/${orgId}/boards/${boardId}/todos`
    );
    const q = query(todosRef, where('listId', '==', listId));
    const batch = writeBatch(firebaseDB);

    const todosSnapshot = await getDocs(q);
    todosSnapshot.forEach((todoDoc) => {
        const todoRef = doc(
            firebaseDB,
            `organizations/${orgId}/boards/${boardId}/todos/${todoDoc.id}`
        );
        batch.update(todoRef, { listId: deleteField() });
    });

    batch.delete(listRef);

    try {
        await batch.commit();
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
