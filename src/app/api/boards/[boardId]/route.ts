import { getBoardServerAction } from '@/lib/firebase/boardServerActions';
import { NextResponse, NextRequest } from 'next/server';
import { getAuthAndOrgContext } from '@/lib/serverUtils';

export async function GET(request: NextRequest, { params }: { params: { boardId: string } }) {
    try {
        const { orgId } = await getAuthAndOrgContext(request);
        const { boardId } = params;
        const result = await getBoardServerAction(orgId, boardId);
        return NextResponse.json(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 401 });
    }
}
