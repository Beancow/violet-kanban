import { NextResponse, NextRequest } from 'next/server';
import { getUserFromAuthHeader } from '@/lib/serverUtils';
import { getUserServerAction } from '@/lib/firebase/userServerActions';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromAuthHeader(request);
        const result = await getUserServerAction(user.id);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error?.message },
                { status: 404 }
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
