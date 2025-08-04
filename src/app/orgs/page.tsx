'use client';
import { useOrganizations } from '@/contexts/OrganizationsProvider';
import OrganizationList from '../components/lists/OrganizationList';
import { Box, Skeleton } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';

export default function OrgsPage() {
    const { organizations, loading } = useOrganizations();
    const router = useRouter();

    if (loading) {
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

    if (!loading && organizations.length === 0) {
        router.push('/org/create');
    }

    return <OrganizationList organizations={organizations} />;
}
