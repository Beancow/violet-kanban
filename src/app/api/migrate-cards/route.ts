import { migrateCardDataAction } from '@/lib/firebase/cardServerActions';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const result = await migrateCardDataAction();
        if (result.success) {
            return NextResponse.json({ message: result.message }, { status: 200 });
        } else {
            return NextResponse.json({ error: result.error?.message || 'Unknown error' }, { status: 500 });
        }
    } catch (error) {
        console.error('API error during migration:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
