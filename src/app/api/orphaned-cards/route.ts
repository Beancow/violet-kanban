import { NextRequest, NextResponse } from 'next/server';
import { getOrphanCardsByOrg } from '@/lib/firebase/cardServerActions';
import { getAuthAndOrgContext } from '@/lib/serverUtils';

export async function GET(req: NextRequest) {
    // this function should get card that are orphaned (without a boardId);
    const { orgId } = await getAuthAndOrgContext(req);
    try {
        const { success, data, error } = await getOrphanCardsByOrg(orgId);
        if (!success) throw error;
        return NextResponse.json({ orphanedCards: data });
    } catch (error) {
        console.error('Error fetching orphaned cards:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orphaned cards' },
            { status: 500 }
        );
    }
}
