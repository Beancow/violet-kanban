import { updateOrganizationServerAction } from '@/lib/firebase/orgServerActions';
import { NextResponse, NextRequest } from 'next/server';
import { getAuthAndOrgContext } from '@/lib/serverUtils';

export async function POST(
    request: NextRequest,
    { params }: { params: { orgId: string } }
) {
    try {
        const { user } = await getAuthAndOrgContext(request);
        const { orgId } = params;
        const data = await request.formData();
        const result = await updateOrganizationServerAction(orgId, data, user);
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
