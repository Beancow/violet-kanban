import { NextResponse, NextRequest } from 'next/server';
import { getAuthAndOrgContext } from '@/lib/serverUtils';
import { createBoardServerAction } from '@/lib/firebase/boardServerActions';
import { Board } from '@/types/appState.type';

export async function POST(request: NextRequest) {
    try {
        const { orgId, user } = await getAuthAndOrgContext(request);
        const { data: boardData, tempId } = await request.json();

        const result = await createBoardServerAction({
            data: boardData as Omit<Board, 'id'>,
            user,
            orgId,
            tempId,
        });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error?.message },
                { status: 500 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An unknown error occurred';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
