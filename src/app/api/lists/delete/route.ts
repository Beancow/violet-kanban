import { deleteListAction } from '@/lib/firebase/listServerActions';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { orgId, boardId, listId } = body;

    const result = await deleteListAction(orgId, boardId, listId);

    return NextResponse.json(result);
}
