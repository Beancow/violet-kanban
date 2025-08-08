import { createListAction } from '@/lib/firebase/listServerActions';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { data } = body;

    const formData = new FormData();
    for (const key in data) {
        formData.append(key, data[key]);
    }

    const result = await createListAction({ data: formData, uid: data.ownerId, orgId: data.organizationId, boardId: data.boardId });

    return NextResponse.json(result);
}
