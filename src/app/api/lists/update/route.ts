import { updateListServerAction } from '@/lib/firebase/listServerActions';
import { NextResponse } from 'next/server';
import { getAuthAndOrgContext } from '@/lib/serverUtils';

export async function POST(request: Request) {
    try {
        const { orgId } = await getAuthAndOrgContext(request);
        const body = await request.json();
        const { boardId, listId, data } = body;

        const result = await updateListServerAction({
            orgId,
            boardId,
            listId,
            data,
        });

        return NextResponse.json(result);
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An unknown error occurred';
        console.error('Error updating list:', error);
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
