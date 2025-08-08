import { updateCardListIdServerAction } from '@/lib/firebase/cardServerActions';
import { NextResponse } from 'next/server';
import { getAuthAndOrgContext } from "@/lib/serverUtils";

export async function POST(request: Request) {
    const { orgId } = await getAuthAndOrgContext(request);
    const body = await request.json();
    const { boardId, cardId, newListId } = body;

    const result = await updateCardListIdServerAction(orgId, boardId, cardId, newListId);

    return NextResponse.json(result);
}
