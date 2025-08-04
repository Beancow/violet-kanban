'use client';
import { getOrganizationsForUserAction } from '@/lib/firebase/orgServerActions';
import { redirect } from 'next/navigation';
import { Button } from '@radix-ui/themes';
import { firebaseAuth } from '@/lib/firebase/firebase-config';

export default async function PostLoginPage() {
    const user = firebaseAuth.currentUser;

    const { data: organizations } =
        user !== null ?
            await getOrganizationsForUserAction(user.uid)
        :   { data: null }; // Or handle the null case appropriately

    if (organizations && organizations.length > 0) redirect('/orgs');

    return (
        <div className='flex flex-col items-center justify-center min-h-screen text-2xl mb-4'>
            <h1>You are not a member of any organization.</h1>
            <Button
                onClick={() => redirect('/org/create')}
                variant='solid'
                color='blue'
            >
                Create Organization
            </Button>
        </div>
    );
}
