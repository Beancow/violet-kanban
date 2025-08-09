import { softDeleteCardServerAction } from '@/lib/firebase/cardServerActions';
import { NextResponse } from 'next/server';
import { getAuthAndOrgContext } from "@/lib/serverUtils";

export async function POST(request: Request) {
    try {
        const { orgId } = await getAuthAndOrgContext(request);
        const { boardId, cardId } = await request.json();

        const result = await softDeleteCardServerAction(orgId, boardId, cardId);

        return NextResponse.json(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("Error soft deleting card:", error);
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
