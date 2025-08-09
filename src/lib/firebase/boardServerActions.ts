'use server';
import { revalidatePath } from 'next/cache';
import { Board, CreateBoardResult } from '@/types/appState.type';
import { adminDataConverter } from './adminDataConverter';
import * as sentry from '@sentry/nextjs';

const getAdminFirestore = async () => {
    const { getAdminFirestore } = await import('./firebase-admin-init');
    return getAdminFirestore();
};

export async function createBoardServerAction({
    data,
    uid,
    orgId,
    tempId,
}: {
    data: Omit<Board, 'id'>;
    uid: string;
    orgId: string;
    tempId: string;
}): Promise<CreateBoardResult> {
    try {
        const adminFirestore = await getAdminFirestore();
        const boardsCollection = adminFirestore.collection(`organizations/${orgId}/boards`);
        const newBoardRef = boardsCollection.doc();

        const newBoard: Board = {
            ...data,
            id: newBoardRef.id,
            ownerId: uid,
            organizationId: orgId,
        };

        await newBoardRef.set(newBoard);
        revalidatePath('/boards');

        return {
            success: true,
            data: {
                tempId: tempId,
                board: newBoard,
            },
        };
    } catch (error) {
        sentry.captureException(error);
        return {
            success: false,
            error: new Error('Failed to create board', { cause: error }),
        };
    }
}

export async function getBoardsForOrganizationServerAction(orgId: string) {
    try {
        const adminFirestore = await getAdminFirestore();
        const boardsCollection = adminFirestore.collection(`organizations/${orgId}/boards`).withConverter(adminDataConverter<Board>());
        const querySnapshot = await boardsCollection.get();
        const boards = querySnapshot.docs.map(doc => doc.data());
        return { success: true, data: boards };
    } catch (error) {
        console.error('Error fetching boards for organization:', error);
        sentry.captureException(error);
        return { success: false, error: new Error('Failed to fetch boards', { cause: error }) };
    }
}