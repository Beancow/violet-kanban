import { restoreCardAction } from '@/lib/firebase/cardServerActions';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { orgId, boardId, cardId } = body;

    const result = await restoreCardAction(orgId, boardId, cardId);

    return NextResponse.json(result);
}
