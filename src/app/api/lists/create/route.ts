import { createListServerAction } from '@/lib/firebase/listServerActions';
import { NextResponse } from 'next/server';
import { getAuthAndOrgContext } from "@/lib/serverUtils";

export async function POST(request: Request) {
    const { uid, orgId } = await getAuthAndOrgContext(request);
    const { data, tempId } = await request.json();

    const result = await createListServerAction({
        data,
        uid,
        orgId,
        boardId: data.boardId,
        tempId,
    });

    return NextResponse.json(result);
}
