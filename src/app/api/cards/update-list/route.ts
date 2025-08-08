import { updateCardListIdAction } from '@/lib/firebase/cardServerActions';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { orgId, boardId, cardId, newListId } = body;

    const result = await updateCardListIdAction(orgId, boardId, cardId, newListId);

    return NextResponse.json(result);
}
