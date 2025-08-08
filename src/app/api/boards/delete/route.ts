import { deleteBoardServerAction } from '@/lib/firebase/boardServerActions';
import { NextResponse } from 'next/server';
import { getAuthAndOrgContext } from "@/lib/serverUtils";

export async function POST(request: Request) {
    const { orgId } = await getAuthAndOrgContext(request);
    const body = await request.json();
    const { boardId } = body;

    const result = await deleteBoardServerAction(orgId, boardId);

    return NextResponse.json(result);
}
