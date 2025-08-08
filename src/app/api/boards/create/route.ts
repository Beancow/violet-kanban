import { createBoard } from '@/lib/firebase/boardServerActions';
import { NextResponse, NextRequest } from 'next/server';
import { getAuthAndOrgContext } from '@/lib/serverUtils';

export async function POST(request: NextRequest) {
    try {
        const { uid, orgId } = await getAuthAndOrgContext(request);
        const body = await request.json();
        const { data: boardData } = body;

        const result = await createBoard(boardData, uid, orgId);

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
}
