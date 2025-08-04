'use client';

import { useAppState } from '@/components/AppStateProvider';
import { Box, Card, Heading, Text, Button } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';

export default function BoardsPage({ params }: { params: { orgId: string } }) {
    const { organizations } = useAppState();
    const organization = organizations.find((org) => org.id === params.orgId);
    const router = useRouter();

    return (
        <Box pt='8'>
            <Card size="4" style={{ width: 425, margin: '0 auto' }}>
                <Heading as="h1" size="6" align="center" mb="5">
                    {organization?.name} Boards
                </Heading>
                <Text>This is where the boards for the organization will be displayed.</Text>
                <Button mt="4" onClick={() => router.push('/orgs')}>
                    Manage Organizations
                </Button>
            </Card>
        </Box>
    );
}
