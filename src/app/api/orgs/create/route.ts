import { createOrganizationServerAction } from '@/lib/firebase/orgServerActions';
import { NextResponse, NextRequest } from 'next/server';
import { getUserFromAuthHeader } from '@/lib/serverUtils';

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromAuthHeader(request);
        const data = await request.json();

        const result = await createOrganizationServerAction(data, user.id);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error?.message },
                { status: 400 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'An unknown error occurred';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
