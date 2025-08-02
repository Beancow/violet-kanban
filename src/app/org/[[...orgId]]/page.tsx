'use client';
import { Button, Flex, Card, Box, Heading, Text, Select } from '@radix-ui/themes';
import { createOrganizationAction, addMemberToOrganizationAction } from '@/lib/firebase/orgServerActions';
import { CreateOrganizationResult, AddMemberToOrganizationResult } from '@/types/appState.type';
import { useAppState } from '@/components/AppStateProvider';
import * as Form from '@radix-ui/react-form';
import { useState } from 'react';

export default function OrgPage() {
    const { user } = useAppState();
    const [orgId, setOrgId] = useState<string | null>(null);

    const handleCreateOrg = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user) {
            alert('You must be logged in to create an organization.');
            return;
        }
        const formData = new FormData(event.currentTarget);
        const result: CreateOrganizationResult = await createOrganizationAction(formData, user.id);
        if (result.success) {
            alert('Organization created successfully!');
            setOrgId(result.data.orgId);
        } else {
            alert(`Error: ${result.error.message}`);
        }
    };

    const handleAddMember = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!orgId) {
            alert('You must create an organization first.');
            return;
        }
        const formData = new FormData(event.currentTarget);
        formData.append('orgId', orgId);
        const result: AddMemberToOrganizationResult = await addMemberToOrganizationAction(formData);
        if (result.success) {
            alert('Member added successfully!');
        } else {
            alert(`Error: ${result.error.message}`);
        }
    };

    return (
        <Box pt='8'>
            <Card size="4" style={{ width: 425, margin: '0 auto' }}>
                <Heading as="h1" size="6" align="center" mb="5">
                    Create a New Organization
                </Heading>

                <Form.Root onSubmit={handleCreateOrg}>
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
                        <Form.Field name="companyName">
                            <Form.Label asChild>
                                <Text as="div" size="2" mb="1" weight="bold">
                                    Company Name
                                </Text>
                            </Form.Label>
                            <Form.Control asChild>
                                <input
                                    name="companyName"
                                    placeholder="Enter company name"
                                />
                            </Form.Control>
                        </Form.Field>
                        <Form.Field name="companyWebsite">
                            <Form.Label asChild>
                                <Text as="div" size="2" mb="1" weight="bold">
                                    Company Website
                                </Text>
                            </Form.Label>
                            <Form.Control asChild>
                                <input
                                    name="companyWebsite"
                                    placeholder="Enter company website"
                                />
                            </Form.Control>
                        </Form.Field>
                        <Form.Field name="logoURL">
                            <Form.Label asChild>
                                <Text as="div" size="2" mb="1" weight="bold">
                                    Logo URL
                                </Text>
                            </Form.Label>
                            <Form.Control asChild>
                                <input
                                    name="logoURL"
                                    placeholder="Enter logo URL"
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

            {orgId && (
                <Card size="4" style={{ width: 425, margin: '2rem auto 0' }}>
                    <Heading as="h1" size="6" align="center" mb="5">
                        Add a New Member
                    </Heading>

                    <Form.Root onSubmit={handleAddMember}>
                        <Flex direction="column" gap="3">
                            <Form.Field name="userId">
                                <Form.Label asChild>
                                    <Text as="div" size="2" mb="1" weight="bold">
                                        User ID
                                    </Text>
                                </Form.Label>
                                <Form.Control asChild>
                                    <input
                                        name="userId"
                                        placeholder="Enter user ID"
                                        required
                                    />
                                </Form.Control>
                            </Form.Field>
                            <Form.Field name="role">
                                <Form.Label asChild>
                                    <Text as="div" size="2" mb="1" weight="bold">
                                        Role
                                    </Text>
                                </Form.Label>
                                <Form.Control asChild>
                                    <input
                                        name="role"
                                        placeholder="Enter role"
                                        required
                                    />
                                </Form.Control>
                            </Form.Field>
                        </Flex>

                        <Flex gap="3" mt="6" justify="end">
                            <Form.Submit asChild>
                                <Button color="green">Add Member</Button>
                            </Form.Submit>
                        </Flex>
                    </Form.Root>
                </Card>
            )}
        </Box>
    );
}
