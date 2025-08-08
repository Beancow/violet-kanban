import { createCardAction } from '@/lib/firebase/cardServerActions';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { data, idToken, orgId, boardId, listId } = body;

    const result = await createCardAction({ data, idToken, orgId, boardId, listId });

    return NextResponse.json(result);
}
