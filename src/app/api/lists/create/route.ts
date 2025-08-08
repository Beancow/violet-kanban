import { createListServerAction } from '@/lib/firebase/listServerActions';
import { NextResponse } from 'next/server';
import { getAuthAndOrgContext } from "@/lib/serverUtils";

export async function POST(request: Request) {
    const { uid, orgId } = await getAuthAndOrgContext(request);
    const body = await request.json();
    const { data } = body;

    const formData = new FormData();
    for (const key in data) {
        formData.append(key, data[key]);
    }

    const result = await createListServerAction({ data: formData, uid, orgId, boardId: data.boardId });

    return NextResponse.json(result);
}
