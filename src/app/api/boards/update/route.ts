import { updateBoardServerAction } from '@/lib/firebase/boardServerActions';
import { NextResponse } from 'next/server';
import { getAuthAndOrgContext } from "@/lib/serverUtils";

export async function POST(request: Request) {
    try {
        const { orgId } = await getAuthAndOrgContext(request);
        const { boardId, data } = await request.json();

        const result = await updateBoardServerAction(orgId, boardId, data);

        return NextResponse.json(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("Error updating board:", error);
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
