import { firebaseGetFirestore } from '@/lib/firebase/firebase-config';
import { Boards } from '@/types/appState.type';
import { addDoc, getDocs, collection, getDoc, doc } from 'firebase/firestore';
import { dataConverter } from './dataConverter';
import * as sentry from '@sentry/nextjs';

const db = firebaseGetFirestore();

export async function createBoardAction(data: FormData, uid: string) {
    const boardCollection = collection(db, `users/${uid}/boards`).withConverter(
        dataConverter<FormData>()
    );
    try {
        const boardDoc = await addDoc(boardCollection, data);
        const boardData = boardDoc.withConverter(dataConverter<FormData>());

        return {
            success: true,
            data: {
                message:
                    'Board created successfully, new Board ID: ' + boardData.id,
                id: boardData.id,
            },
        };
    } catch (error) {
        sentry.captureException(error);
        console.error('Error creating board:', error);
        return {
            success: false,
            error: new Error('Failed to create board', { cause: error }),
        };
    }
}

export async function getBoardAction(uid: string, boardId: string) {
    const boardCollectionRef = doc(db, `users/${uid}/boards/${boardId}`);
    try {
        const boardDocs = await getDoc(boardCollectionRef);
        const boardData = boardDocs
            .data()
            ?.withConverter(dataConverter<Boards>());

        if (!boardData) {
            sentry.captureException(
                new Error(`Board with ID ${boardId} not found for user ${uid}`)
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

export async function getBoardsAction(uid: string) {
    const boardsCollection = collection(db, `users/${uid}/boards`);
    try {
        const boardsSnapshot = await getDocs(boardsCollection);
        const boardsList: Boards[] = boardsSnapshot.docs.map((doc) =>
            doc.data().withConverter(dataConverter<Boards>())
        );
        sentry.captureMessage(
            `Fetched ${boardsList.length} boards for user ${uid}`
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
