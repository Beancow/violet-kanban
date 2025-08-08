'use server';
import { revalidatePath } from 'next/cache';
import { Board } from '@/types/appState.type';
import { adminDataConverter } from './adminDataConverter';
import * as sentry from '@sentry/nextjs';
import { getListsAction } from './listServerActions';
import { getCardsAction } from './cardServerActions';

// Dynamic import for firebase-admin-init
const getAdminFirestore = async () => {
    const { getAdminFirestore } = await import('./firebase-admin-init');
    return getAdminFirestore();
};

export async function getBoardAction(orgId: string, boardId: string) {
    try {
        const adminFirestore = await getAdminFirestore();
        const boardDocRef = adminFirestore.doc(
            `organizations/${orgId}/boards/${boardId}`
        ).withConverter(adminDataConverter<Board>());

        const boardDocSnapshot = await boardDocRef.get();
        const boardData = boardDocSnapshot.data();

        if (!boardData) {
            sentry.captureException(
                new Error(`Board with ID ${boardId} not found in org ${orgId}`)
            );
            return {
                success: false,
                error: new Error('Board not found'),
            };
        }

        // Fetch lists and cards for the single board
        const listsResult = await getListsAction({ orgId, boardId });
        const cardsResult = await getCardsAction({ orgId, boardId });

        const board: Board = {
            ...boardData,
            id: boardId,
            lists: listsResult.success ? listsResult.data : [],
            cards: cardsResult.success ? cardsResult.data : [],
        };

        return {
            success: true,
            data: board,
        };
    } catch (error) {
        sentry.captureException(error);
        console.error(`Error fetching board ${boardId}:`, error);
        return {
            success: false,
            error: new Error('Failed to fetch board', { cause: error }),
        };
    }
}

export async function getBoardsAction(orgId: string) {
    try {
        const adminFirestore = await getAdminFirestore();
        const boardsCollection = adminFirestore.collection(
            `organizations/${orgId}/boards`
        ).withConverter(adminDataConverter<Board>());

        const boardsSnapshot = await boardsCollection.get();
        const boardsList: Board[] = boardsSnapshot.docs.map((doc) => {
            const boardData = doc.data();
            const boardId = doc.id;
            return {
                ...boardData,
                id: boardId,
                lists: [], // Initialize as empty, fetched by individual board page
                cards: [], // Initialize as empty, fetched by individual board page
                orphanedCards: [], // Initialize as empty
            };
        });
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

export async function createBoard(boardData: Omit<Board, 'id'>, uid: string, orgId: string) {
    try {
        const adminFirestore = await getAdminFirestore();
        const response = await adminFirestore.collection(
            `organizations/${orgId}/boards`
        ).add({
            ...boardData,
        });

        const newBoard: Board = {
            ...boardData,
            id: response.id as string,
        };

        revalidatePath(`/board/${newBoard.id}`); // Revalidate the new board's page
        return {
            success: true,
            data: newBoard,
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

export async function deleteBoardAction(orgId: string, boardId: string) {
    try {
        const adminFirestore = await getAdminFirestore();
        const boardRef = adminFirestore.doc(`organizations/${orgId}/boards/${boardId}`);
        const listsRef = adminFirestore.collection(`organizations/${orgId}/boards/${boardId}/lists`);
        const cardsRef = adminFirestore.collection(`organizations/${orgId}/boards/${boardId}/cards`);

        const batch = adminFirestore.batch();

        // Delete all lists within the board
        const listsSnapshot = await listsRef.get();
        listsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete all cards within the board
        const cardsSnapshot = await cardsRef.get();
        cardsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete the board itself
        batch.delete(boardRef);

        await batch.commit();
        revalidatePath(`/orgs/${orgId}`); // Revalidate the organization page to reflect board deletion
        return { success: true };
    } catch (error) {
        sentry.captureException(error);
        console.error('Error deleting board:', error);
        return {
            success: false,
            error: new Error('Failed to delete board', { cause: error }),
        };
    }
}
