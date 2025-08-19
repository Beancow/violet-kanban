import { createListServerAction } from '@/lib/firebase/listServerActions';
import { NextResponse } from 'next/server';
import { getAuthAndOrgContext } from '@/lib/serverUtils';

export async function POST(request: Request) {
    const { orgId } = await getAuthAndOrgContext(request);
    const { data, tempId } = await request.json();

    const result = await createListServerAction({
        data,
        orgId,
        tempId,
    });

    return NextResponse.json(result);
}
