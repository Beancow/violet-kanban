'use client';
import { Button, Flex, Card, Box, Heading, Text } from '@radix-ui/themes';
import Link from 'next/link';
import { useAppState } from '@/components/AppStateProvider';
import { addMemberToOrganizationAction } from '@/lib/firebase/orgServerActions';

export default function OrgList() {
    const { organizations, user } = useAppState();

    const handleJoin = async (orgId: string) => {
        if (!user) {
            alert('You must be logged in to join an organization.');
            return;
        }
        const formData = new FormData();
        formData.append('orgId', orgId);
        formData.append('userId', user.id);
        formData.append('role', 'member');
        const result = await addMemberToOrganizationAction(formData);
        if (result.success) {
            alert('Successfully joined organization!');
        } else {
            alert(`Error: ${result.error?.message}`);
        }
    };

    return (
        <Box pt='8'>
            <Card size="4" style={{ width: 425, margin: '0 auto' }}>
                <Heading as="h1" size="6" align="center" mb="5">
                    Organizations
                </Heading>

                <Flex direction="column" gap="3">
                    {organizations.map((org) => (
                        <Card key={org.id}>
                            <Flex justify="between" align="center">
                                <Box>
                                    <Text as="div" size="2" weight="bold">
                                        {org.name}
                                    </Text>
                                    <Text as="div" size="2" color="gray">
                                        {org.type}
                                    </Text>
                                </Box>
                                <Button onClick={() => handleJoin(org.id!)}>
                                    Join
                                </Button>
                            </Flex>
                        </Card>
                    ))}
                </Flex>

                <Flex gap="3" mt="6" justify="end">
                    <Button asChild color="green">
                        <Link href="/org/create">Create New Organization</Link>
                    </Button>
                </Flex>
            </Card>
        </Box>
    );
}
