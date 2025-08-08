import { deleteBoardAction } from '@/lib/firebase/boardServerActions';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { orgId, boardId } = body;

    const result = await deleteBoardAction(orgId, boardId);

    return NextResponse.json(result);
}
