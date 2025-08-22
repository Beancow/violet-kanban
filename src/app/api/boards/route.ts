import { NextRequest, NextResponse } from 'next/server';
import { getAuthAndOrgContext } from '@/lib/serverUtils';
import {
    getBoardsForOrganizationServerAction,
    createBoardServerAction,
} from '@/lib/firebase/boardServerActions';

export async function GET(_request: NextRequest) {
    try {
        const { orgId } = await getAuthAndOrgContext(_request);
        const result = await getBoardsForOrganizationServerAction(orgId);
        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error?.message },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, boards: result.data });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: (error as Error).message },
            { status: 500 }
        );
    }
}

// Example POST handler for /api/boards
export async function POST(_request: NextRequest) {
    try {
        const { user, orgId } = await getAuthAndOrgContext(_request);

        // Expect the client to send { data: Omit<Board, 'id'> }
        const body = await _request.json();
        const data = body?.data;

        if (!data) {
            return NextResponse.json(
                { success: false, error: 'Request body must include data' },
                { status: 400 }
            );
        }

        const result = await createBoardServerAction({ data, user, orgId });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error?.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: true, board: result.data?.board },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, error: (error as Error).message },
            { status: 500 }
        );
    }
}
