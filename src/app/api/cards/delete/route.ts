import { softDeleteCardServerAction } from '@/lib/firebase/cardServerActions';
import { NextResponse } from 'next/server';
import { getAuthAndOrgContext } from "@/lib/serverUtils";

export async function POST(request: Request) {
    const { orgId } = await getAuthAndOrgContext(request);
    const body = await request.json();
    const { boardId, cardId } = body;

    const result = await softDeleteCardServerAction(orgId, boardId, cardId);

    return NextResponse.json(result);
}
