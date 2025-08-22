import { createCardServerAction } from '@/lib/firebase/cardServerActions';
import { NextResponse, NextRequest } from 'next/server';
import { getAuthAndOrgContext } from '@/lib/serverUtils';

export async function POST(request: NextRequest) {
    const { user, orgId } = await getAuthAndOrgContext(request);
    const body = await request.json();
    const { data, boardId, listId } = body;

    const result = await createCardServerAction({
        data,
        user,
        orgId,
        boardId,
        listId,
    });

    return NextResponse.json(result);
}
