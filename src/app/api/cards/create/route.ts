import { createCardServerAction } from '@/lib/firebase/cardServerActions';
import { NextResponse } from 'next/server';
import { getAuthAndOrgContext } from "@/lib/serverUtils";

export async function POST(request: Request) {
    const { uid, orgId } = await getAuthAndOrgContext(request);
    const body = await request.json();
    const { data, boardId, listId } = body;

    const result = await createCardServerAction({ data, uid, orgId, boardId, listId });

    return NextResponse.json(result);
}
