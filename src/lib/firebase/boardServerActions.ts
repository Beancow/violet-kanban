'use server';
import { revalidatePath } from 'next/cache';
import { Board, CreateBoardResult, User } from '@/types/appState.type';
import { adminDataConverter } from './adminDataConverter';
import * as sentry from '@/lib/sentryWrapper';
import { BoardSchema } from '@/schema/boardSchema';
import { FieldValue } from 'firebase-admin/firestore';

const getAdminFirestore = async () => {
    const { getAdminFirestore } = await import('./firebase-admin-init');
    return getAdminFirestore();
};

export async function createBoardServerAction({
    data,
    user,
    orgId,
}: {
    data: Omit<Board, 'id'>;
    user: User;
    orgId: string;
}): Promise<CreateBoardResult> {
    if (!orgId || !user?.id) {
        const error = new Error(
            'Organization ID and User ID are required to create a board.'
        );
        sentry.captureException(error);
        return { success: false, error };
    }

    const result = BoardSchema.safeParse(data);
    if (!result.success) {
        return {
            success: false,
            error: new Error(
                'Invalid board data: ' + JSON.stringify(result.error.cause)
            ),
        };
    }
    const validBoard = result.data;

    try {
        const adminFirestore = await getAdminFirestore();
        const boardsCollection = adminFirestore.collection(
            `organizations/${orgId}/boards`
        );
        const newBoardRef = boardsCollection.doc();

        const newBoard: Board = {
            ...validBoard,
            createdAt: FieldValue.serverTimestamp().toString(),
            updatedAt: FieldValue.serverTimestamp().toString(),
            id: newBoardRef.id,
            organizationId: orgId,
            createdBy: {
                userId: user.id,
                name: user.name,
                email: user.email,
            },
            lists: [],
            cards: [],
        };

        await newBoardRef.set(newBoard);
        revalidatePath('/boards');

        return {
            success: true,
            data: {
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
    console.log(
        `[getBoardsForOrganizationServerAction] Called with orgId:`,
        orgId
    );
    try {
        const adminFirestore = await getAdminFirestore();
        const boardsCollection = adminFirestore
            .collection(`organizations/${orgId}/boards`)
            .withConverter(adminDataConverter<Board>());
        const querySnapshot = await boardsCollection.get();
        const boards = querySnapshot.docs.map((doc) => doc.data());
        return { success: true, data: boards };
    } catch (error) {
        console.error('Error fetching boards for organization:', error);
        sentry.captureException(error);
        return {
            success: false,
            error: new Error('Failed to fetch boards', { cause: error }),
        };
    }
}

export async function updateBoardServerAction(
    orgId: string,
    boardId: string,
    data: Partial<Board>
) {
    try {
        const adminFirestore = await getAdminFirestore();
        const boardRef = adminFirestore.doc(
            `organizations/${orgId}/boards/${boardId}`
        );
        await boardRef.update({
            ...data,
            updatedAt: FieldValue.serverTimestamp(),
        });
        revalidatePath(`/board/${boardId}`);
        return { success: true };
    } catch (error) {
        sentry.captureException(error);
        console.error('Error updating board:', error);
        return {
            success: false,
            error: new Error('Failed to update board', { cause: error }),
        };
    }
}

export async function deleteBoardServerAction(orgId: string, boardId: string) {
    try {
        const adminFirestore = await getAdminFirestore();
        const boardRef = adminFirestore.doc(
            `organizations/${orgId}/boards/${boardId}`
        );
        await boardRef.delete();
        revalidatePath('/boards');
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
