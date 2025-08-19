import { deleteBoardServerAction } from '@/lib/firebase/boardServerActions';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthAndOrgContext } from '@/lib/serverUtils';

export async function POST(request: NextRequest) {
    try {
        const { orgId } = await getAuthAndOrgContext(request);
        const { boardId } = await request.json();

        const result = await deleteBoardServerAction(orgId, boardId);

        return NextResponse.json(result);
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An unknown error occurred';
        console.error('Error deleting board:', error);
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
