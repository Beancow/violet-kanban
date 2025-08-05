'use client';
import { Button, Flex, Card, Box, Heading, Text } from '@radix-ui/themes';
import { Organization } from '@/types/appState.type';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserProvider';

export default function OrganizationList({
    organizations,
}: {
    organizations: Organization[];
}) {
    const { user, setCurrentOrganization } = useUser();
    const router = useRouter();

    const handleSetDefaultOrg = async (orgId: string) => {
        if (!user) {
            return;
        }
        if (orgId === user.currentOrganizationId) {
            return;
        }
        try {
            setCurrentOrganization(orgId);
            router.push('/boards');
        } catch (error) {
            console.error('Error setting default organization:', error);
        }
    };

    return (
        <Box pt='8'>
            <Heading as='h1' size='6' align='center' mb='5'>
                Your Organizations
            </Heading>
            <Flex wrap='wrap' gap='4' justify='center'>
                {organizations.map((org) => (
                    <Card key={org.id} style={{ cursor: 'pointer' }}>
                        <Box onClick={() => router.push(`/org/${org.id}`)}>
                            <Heading as='h3' size='4'>
                                {org.name}
                            </Heading>
                            <Text as='p' color='gray'>
                                {org.type}
                            </Text>
                        </Box>
                        <Button
                            mt='2'
                            onClick={() => handleSetDefaultOrg(org.id)}
                        >
                            Set as Default
                        </Button>
                    </Card>
                ))}
            </Flex>
        </Box>
    );
}
