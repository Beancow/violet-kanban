import { NextRequest, NextResponse } from 'next/server';
import { getAuthAndOrgContext } from '@/lib/serverUtils';
import { getListsServerAction } from '@/lib/firebase/listServerActions';
import type { BoardList } from '@/types/appState.type';
import { getBoardsForOrganizationServerAction } from '@/lib/firebase/boardServerActions';

export async function GET(request: NextRequest) {
    try {
        const { orgId } = await getAuthAndOrgContext(request);
        // Get all boards for the organization
        const boardsResult = await getBoardsForOrganizationServerAction(orgId);
        if (!boardsResult.success || !Array.isArray(boardsResult.data)) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        boardsResult.error?.message || 'Failed to fetch boards',
                },
                { status: 404 }
            );
        }
        // Fetch lists for each board
        const allLists: BoardList[] = [];
        for (const board of boardsResult.data) {
            const listsResult = await getListsServerAction({
                orgId,
                boardId: board.id,
            });
            if (listsResult.success && Array.isArray(listsResult.data)) {
                allLists.push(...listsResult.data);
            }
        }
        return NextResponse.json({ success: true, lists: allLists });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: (error as Error).message },
            { status: 500 }
        );
    }
}
