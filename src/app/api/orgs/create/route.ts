import { createOrganizationServerAction } from '@/lib/firebase/orgServerActions';
import { NextResponse, NextRequest } from 'next/server';
import { getUserFromAuthHeader } from '@/lib/serverUtils';

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromAuthHeader(request);
        const data = await request.json();

        const result = await createOrganizationServerAction(data, user.id);

        if (!result.success) {
            // Include error message and cause when available for diagnostics
            const errMsg =
                result.error?.message ?? 'Failed to create organization';
            const cause = (result.error as any)?.cause;
            return NextResponse.json(
                {
                    success: false,
                    error: errMsg,
                    cause: cause?.message || String(cause ?? ''),
                },
                { status: 400 }
            );
        }

        // Normalize successful response to include orgId and message and use 201
        return NextResponse.json(
            {
                success: true,
                orgId: result.data?.orgId,
                message: result.data?.message,
            },
            { status: 201 }
        );
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
