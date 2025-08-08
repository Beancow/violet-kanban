import { createBoardServerAction } from '@/lib/firebase/boardServerActions';
import { NextResponse, NextRequest } from 'next/server';
import { getAuthAndOrgContext } from '@/lib/serverUtils';

export async function POST(request: NextRequest) {
    try {
        const { uid, orgId } = await getAuthAndOrgContext(request);
        const body = await request.json();
        const { data: boardData } = body;

        const result = await createBoardServerAction(boardData, uid, orgId);

        return NextResponse.json(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 401 });
    }
}
