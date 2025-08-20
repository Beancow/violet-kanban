import { deleteOrganizationServerAction } from '@/lib/firebase/orgServerActions';
import { NextResponse, NextRequest } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: { orgId: string } }
) {
    try {
        const { orgId } = params;
        const result = await deleteOrganizationServerAction(orgId);
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
