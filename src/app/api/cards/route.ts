import { NextRequest, NextResponse } from 'next/server';
import { getAuthAndOrgContext } from '@/lib/serverUtils';
import { getBoardsForOrganizationServerAction } from '@/lib/firebase/boardServerActions';
import { getCardsServerAction } from '@/lib/firebase/cardServerActions';
import type { BoardCard } from '@/types/appState.type';

export async function GET(_request: NextRequest) {
    try {
        const { orgId } = await getAuthAndOrgContext(_request);
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
        // Fetch cards for each board
        const allCards: BoardCard[] = [];
        for (const board of boardsResult.data) {
            const cardsResult = await getCardsServerAction({
                orgId,
                boardId: board.id,
            });
            if (cardsResult.success && Array.isArray(cardsResult.data)) {
                allCards.push(...cardsResult.data);
            }
        }
        return NextResponse.json({ success: true, cards: allCards });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: (error as Error).message },
            { status: 500 }
        );
    }
}
