import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAuthHeader } from '@/lib/serverUtils';
import {
    getOrganizationsForUserServerAction,
    createOrganizationServerAction,
} from '@/lib/firebase/orgServerActions';

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
export async function POST(_request: NextRequest) {
    try {
        const user = await getUserFromAuthHeader(_request);
        const body = await _request.json();

        if (!body || typeof body !== 'object') {
            return NextResponse.json(
                { success: false, error: 'Request body required' },
                { status: 400 }
            );
        }

        const result = await createOrganizationServerAction(body, user.id);
        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error?.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                orgId: result.data?.orgId,
                message: result.data?.message,
            },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, error: (error as Error).message },
            { status: 500 }
        );
    }
}
