'use client';
import { useOrganizations } from '@/contexts/OrganizationsProvider';
import OrganizationList from '../components/lists/OrganizationList';
import { Box, Skeleton } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';

export default function OrgsPage() {
    const { organizations, loading: organizationsLoading } = useOrganizations();
    const router = useRouter();

    if (organizationsLoading) {
        return (
            <Box
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                <Skeleton />
            </Box>
        );
    }

    if (!organizationsLoading && organizations.length < 1) {
        router.push('/org/create');
    }

    return <OrganizationList organizations={organizations} />;
}
