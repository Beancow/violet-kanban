import { NextRequest, NextResponse } from 'next/server';
import { getAuthAndOrgContext } from '@/lib/serverUtils';
import { getBoardsForOrganizationServerAction } from '@/lib/firebase/boardServerActions';

export async function GET(request: NextRequest) {
    try {
        const { user, orgId } = await getAuthAndOrgContext(request);
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
export async function POST(request: NextRequest) {
    // TODO: Replace with real board creation logic
    return NextResponse.json({
        success: true,
        message: 'Board created.',
    });
}
