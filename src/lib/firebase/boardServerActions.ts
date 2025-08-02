import { firebaseGetFirestore } from '@/lib/firebase/firebase-config';
import { Boards } from '@/types/appState.type';
import { getDocs, collection, getDoc, doc } from 'firebase/firestore';
import { dataConverter } from './dataConverter';
import * as sentry from '@sentry/nextjs';
import { hasPermission } from './utils/hasPermission';

const db = firebaseGetFirestore();

export async function getBoardAction(orgId: string, boardId: string) {
    if (!hasPermission(orgId, 'member')) {
        return {
            success: false,
            error: new Error('User does not have permission to view boards'),
        };
    }

    const boardCollectionRef = doc(
        db,
        `organizations/${orgId}/boards/${boardId}`
    );
    try {
        const boardDocs = await getDoc(boardCollectionRef);
        const boardData = boardDocs
            .data()
            ?.withConverter(dataConverter<Boards>());

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
        db,
        `organizations/${orgId}/boards`
    );
    try {
        const boardsSnapshot = await getDocs(boardsCollection);
        const boardsList: Boards[] = boardsSnapshot.docs.map((doc) =>
            doc.data().withConverter(dataConverter<Boards>())
        );
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
