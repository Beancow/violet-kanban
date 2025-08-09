
import { NextResponse, NextRequest } from 'next/server';
import { getAuthAndOrgContext } from '@/lib/serverUtils';
import { getOrganizationServerAction } from '@/lib/firebase/orgServerActions';
import { getBoardsForOrganizationServerAction } from '@/lib/firebase/boardServerActions';
import { getListsServerAction } from '@/lib/firebase/listServerActions';
import { getCardsServerAction } from '@/lib/firebase/cardServerActions';
import { List, BoardCard } from '@/types/appState.type';

export async function GET(request: NextRequest) {
    try {
        // Derive orgId from the header, making it the single source of truth.
        const { uid, orgId } = await getAuthAndOrgContext(request);

        const [orgResult, boardsResult] = await Promise.all([
            getOrganizationServerAction(orgId, uid),
            getBoardsForOrganizationServerAction(orgId)
        ]);

        if (!orgResult.success || !boardsResult.success) {
            const errorResult = [orgResult, boardsResult].find(r => !r.success);
            return NextResponse.json({ success: false, error: errorResult?.error?.message || 'An unknown error occurred' }, { status: 500 });
        }

        const boards = boardsResult.data || [];
        let allLists: List[] = [];
        let allCards: BoardCard[] = [];

        await Promise.all(boards.map(async (board) => {
            const [listsResult, cardsResult] = await Promise.all([
                getListsServerAction({ orgId, boardId: board.id }),
                getCardsServerAction({ orgId, boardId: board.id })
            ]);

            if (listsResult.success && listsResult.data) {
                allLists = allLists.concat(listsResult.data);
            }
            if (cardsResult.success && cardsResult.data) {
                allCards = allCards.concat(cardsResult.data);
            }
        }));

        return NextResponse.json({
            success: true,
            data: {
                organization: orgResult.data,
                boards: boards,
                lists: allLists,
                cards: allCards,
            },
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
