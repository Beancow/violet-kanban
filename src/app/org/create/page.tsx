'use client';
import { Button, Flex, Card, Box, Heading, Text, Select } from '@radix-ui/themes';
import { createOrganizationAction } from '@/lib/firebase/orgServerActions';
import { useAppState } from '@/components/AppStateProvider';
import * as Form from '@radix-ui/react-form';

export default function CreateOrganizationPage() {
    const { user } = useAppState();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user) {
            alert('You must be logged in to create an organization.');
            return;
        }
        const formData = new FormData(event.currentTarget);
        const result = await createOrganizationAction(formData, user.id);
        if (result.success) {
            alert('Organization created successfully!');
        } else {
            alert(`Error: ${result.error?.message}`);
        }
    };

    return (
        <Box pt='8'>
            <Card size="4" style={{ width: 425, margin: '0 auto' }}>
                <Heading as="h1" size="6" align="center" mb="5">
                    Create a New Organization
                </Heading>

                <Form.Root onSubmit={handleSubmit}>
                    <Flex direction="column" gap="3">
                        <Form.Field name="name">
                            <Form.Label asChild>
                                <Text as="div" size="2" mb="1" weight="bold">
                                    Organization Name
                                </Text>
                            </Form.Label>
                            <Form.Control asChild>
                                <input
                                    name="name"
                                    placeholder="Enter organization name"
                                    required
                                />
                            </Form.Control>
                        </Form.Field>
                        <Form.Field name="type">
                            <Form.Label asChild>
                                <Text as="div" size="2" mb="1" weight="bold">
                                    Organization Type
                                </Text>
                            </Form.Label>
                            <Select.Root name="type" defaultValue="personal">
                                <Select.Trigger />
                                <Select.Content>
                                    <Select.Item value="personal">Personal</Select.Item>
                                    <Select.Item value="company">Company</Select.Item>
                                </Select.Content>
                            </Select.Root>
                        </Form.Field>
                    </Flex>

                    <Heading as="h2" size="4" align="center" mt="5" mb="3">
                        Organization Creator
                    </Heading>
                    <Flex direction="column" gap="3">
                        <Form.Field name="creatorName">
                            <Form.Label asChild>
                                <Text as="div" size="2" mb="1" weight="bold">
                                    Creator Name
                                </Text>
                            </Form.Label>
                            <Form.Control asChild>
                                <input
                                    name="creatorName"
                                    value={user?.displayName || ''}
                                    readOnly
                                />
                            </Form.Control>
                        </Form.Field>
                        <Form.Field name="creatorEmail">
                            <Form.Label asChild>
                                <Text as="div" size="2" mb="1" weight="bold">
                                    Creator Email
                                </Text>
                            </Form.Label>
                            <Form.Control asChild>
                                <input
                                    name="creatorEmail"
                                    value={user?.email || ''}
                                    readOnly
                                />
                            </Form.Control>
                        </Form.Field>
                    </Flex>

                    <Flex gap="3" mt="6" justify="end">
                        <Form.Submit asChild>
                            <Button color="green">Create Organization</Button>
                        </Form.Submit>
                    </Flex>
                </Form.Root>
            </Card>
        </Box>
    );
}
