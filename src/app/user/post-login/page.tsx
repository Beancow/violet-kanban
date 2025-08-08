'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@radix-ui/themes';
import { useOrganizations } from '@/contexts/OrganizationsProvider';
import { useEffect } from 'react';
import LoadingPage from '@/components/LoadingPage';

export default function PostLoginPage() {
    const router = useRouter();
    const { organizations, loading: orgsLoading } = useOrganizations();

    useEffect(() => {
        if (!orgsLoading && organizations.length > 0) {
            router.push('/boards');
        }
    }, [orgsLoading, organizations.length, router]);

    if (orgsLoading) {
        return <LoadingPage dataType='organizations' />;
    }

    return (
        <div className='flex flex-col items-center justify-center min-h-screen text-2xl mb-4'>
            <h1>You are not a member of any organization.</h1>
            <Button
                onClick={() => router.push('/org/create')}
                variant='solid'
                color='blue'
            >
                Create Organization
            </Button>
        </div>
    );
}
