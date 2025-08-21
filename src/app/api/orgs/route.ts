import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuthHeader } from '@/lib/serverUtils';
import { getOrganizationsForUserServerAction } from '@/lib/firebase/orgServerActions';

export async function GET(_request: NextRequest) {
    try {
        const user = await getUserFromAuthHeader(_request);
        const result = await getOrganizationsForUserServerAction(user.id);
        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error?.message },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, organizations: result.data });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: (error as Error).message },
            { status: 500 }
        );
    }
}

// Example POST handler for /api/orgs
export async function POST(request: NextRequest) {
    // TODO: Replace with real org creation logic
    return NextResponse.json({
        success: true,
        message: 'Organization created.',
    });
}
