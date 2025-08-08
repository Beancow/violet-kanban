'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/contexts/UserProvider';
import { useOrganizations } from '@/contexts/OrganizationsProvider';

export function useRequireOrganization() {
    const { currentOrganizationId, loading: userLoading } = useUser();
    const { loading: orgsLoading } = useOrganizations();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Wait for both user and organizations to finish loading
        if (userLoading || orgsLoading) {
            return;
        }

        // If currentOrganizationId is null and not already on org selection/creation pages
        if (
            !currentOrganizationId &&
            pathname !== '/orgs' &&
            pathname !== '/org/create'
        ) {
            router.push(`/orgs?returnTo=${encodeURIComponent(pathname)}`);
        }
    }, [currentOrganizationId, userLoading, orgsLoading, router, pathname]);
}
