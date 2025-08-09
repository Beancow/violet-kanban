import { getOrganizationServerAction } from '@/lib/firebase/orgServerActions';
import { NextResponse, NextRequest } from 'next/server';
import { getAuthAndOrgContext } from '@/lib/serverUtils';

export async function GET(request: NextRequest) {
    try {
        const { uid, orgId } = await getAuthAndOrgContext(request);

        const result = await getOrganizationServerAction(orgId, uid);
        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error?.message }, { status: 404 });
        }
        return NextResponse.json(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}