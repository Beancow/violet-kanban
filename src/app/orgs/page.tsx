'use client';
import { useAppState } from '@/components/AppStateProvider';
import OrganizationList from './components/OrganizationList';
import { Box, Spinner } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';

export default function OrgsPage() {
    const { organizations, orgsLoading } = useAppState();
    const router = useRouter();

    if (orgsLoading) {
        return (
            <Box
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                <Spinner size='3' />
            </Box>
        );
    }

    if (organizations.length === 0) {
        router.push('/org/create');
        return null;
    }

    return <OrganizationList organizations={organizations} />;
}
