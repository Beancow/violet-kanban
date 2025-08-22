import { createListServerAction } from '@/lib/firebase/listServerActions';
import { NextResponse, NextRequest } from 'next/server';
import { getAuthAndOrgContext } from '@/lib/serverUtils';

export async function POST(request: NextRequest) {
    const { orgId } = await getAuthAndOrgContext(request);
    const { data } = await request.json();

    const result = await createListServerAction({
        data,
        orgId,
    });

    return NextResponse.json(result);
}
