'use client';
import { useOrganizations } from '@/contexts/OrganizationsProvider';
import OrganizationList from '../components/lists/OrganizationList';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingPage from '@/components/LoadingPage';
import { useEffect } from 'react';

export default function OrgsPage() {
    const { organizations, loading: organizationsLoading } = useOrganizations();
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo');

    useEffect(() => {
        if (!organizationsLoading && organizations.length < 1) {
            router.push('/org/create');
        }
    }, [organizationsLoading, organizations.length, router]);

    if (organizationsLoading) {
        return <LoadingPage dataType='organizations' />;
    }

    return <OrganizationList organizations={organizations} returnTo={returnTo} />;
}
