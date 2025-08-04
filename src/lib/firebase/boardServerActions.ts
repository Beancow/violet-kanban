import { firebaseDB } from '@/lib/firebase/firebase-config';
import { Board } from '@/types/appState.type';
import { getDocs, collection, getDoc, doc, addDoc } from 'firebase/firestore';
import { dataConverter } from './dataConverter';
import * as sentry from '@sentry/nextjs';
import { hasPermission } from './utils/hasPermission';

export async function getBoardAction(orgId: string, boardId: string) {
    if (!hasPermission(orgId, 'member')) {
        return {
            success: false,
            error: new Error('User does not have permission to view boards'),
        };
    }

    const boardCollectionRef = doc(
        firebaseDB,
        `organizations/${orgId}/boards/${boardId}`
    ).withConverter(dataConverter<Board>());
    try {
        const boardDocs = await getDoc(boardCollectionRef);
        const boardData = boardDocs.data();

        if (!boardData) {
            sentry.captureException(
                new Error(`Board with ID ${boardId} not found in org ${orgId}`)
            );
            return {
                success: false,
                error: new Error('Board not found'),
            };
        }
        return {
            success: true,
            data: boardData,
        };
    } catch (error) {
        sentry.captureException(error);
        console.error('Error fetching board:', error);
        return {
            success: false,
            error: new Error('Failed to fetch board', { cause: error }),
        };
    }
}

export async function getBoardsAction(orgId: string) {
    if (!hasPermission(orgId, 'member')) {
        return {
            success: false,
            error: new Error('User does not have permission to view boards'),
        };
    }

    const boardsCollection = collection(
        firebaseDB,
        `organizations/${orgId}/boards`
    ).withConverter(dataConverter<Board>());
    try {
        const boardsSnapshot = await getDocs(boardsCollection);
        const boardsList: Board[] = boardsSnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
        }));
        sentry.captureMessage(
            `Fetched ${boardsList.length} boards for org ${orgId}`
        );
        return {
            success: true,
            data: boardsList,
        };
    } catch (error) {
        sentry.captureException(error);
        console.error('Error fetching boards:', error);
        return {
            success: false,
            error: new Error('Failed to fetch boards', { cause: error }),
        };
    }
}

export async function createBoard(data: FormData, uid: string, orgId: string) {
    const board = {
        title: data.get('title')?.valueOf(),
        description: data.get('description')?.valueOf(),
        organizationId: orgId,
        ownerId: uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
    };

    if (!board.title || !board.description) {
        throw new Error('Invalid data');
    }

    const response = await addDoc(
        collection(firebaseDB, `organizations/${orgId}/boards`),
        {
            ...board,
        }
    );

    return {
        success: true,
        data: response,
    };
}
