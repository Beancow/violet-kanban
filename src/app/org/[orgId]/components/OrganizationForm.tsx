'use client';
import { Button, Flex, Card, Heading, Text, Select } from '@radix-ui/themes';
import { Organization } from '@/types/appState.type';
import * as Form from '@radix-ui/react-form';

export default function OrganizationForm({
    org,
    user,
    onSubmit,
    onDelete,
}: {
    org: Organization;
    user: any;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
    onDelete?: () => Promise<void>;
}) {
    return (
        <Card size='4' style={{ width: 425, margin: '0 auto' }}>
            <Heading as='h1' size='6' align='center' mb='5'>
                Update Organization
            </Heading>

            {user && (
                <Flex direction='column' gap='1' mb='4'>
                    <Text as='div' size='2' weight='bold'>
                        Current User
                    </Text>
                    <Text as='div' size='2' color='gray'>
                        Email: {user.email}
                    </Text>
                    <Text as='div' size='2' color='gray'>
                        UID: {user.id}
                    </Text>
                </Flex>
            )}

            <Form.Root onSubmit={onSubmit}>
                <Flex direction='column' gap='3'>
                    <Form.Field name='name'>
                        <Form.Label asChild>
                            <Text as='div' size='2' mb='1' weight='bold'>
                                Organization Name
                            </Text>
                        </Form.Label>
                        <Form.Control asChild>
                            <input
                                name='name'
                                placeholder='Enter organization name'
                                defaultValue={org?.name}
                                required
                            />
                        </Form.Control>
                    </Form.Field>
                    <Form.Field name='type'>
                        <Form.Label asChild>
                            <Text as='div' size='2' mb='1' weight='bold'>
                                Organization Type
                            </Text>
                        </Form.Label>
                        <Select.Root name='type' defaultValue={org.type}>
                            <Select.Trigger />
                            <Select.Content>
                                <Select.Item value={org.type}>
                                    {org?.type}
                                </Select.Item>
                                <Select.Item value='company'>
                                    Company
                                </Select.Item>
                            </Select.Content>
                        </Select.Root>
                    </Form.Field>
                    <Form.Field name='companyName'>
                        <Form.Label asChild>
                            <Text as='div' size='2' mb='1' weight='bold'>
                                Company Name
                            </Text>
                        </Form.Label>
                        <Form.Control asChild>
                            <input
                                name='companyName'
                                placeholder='Enter company name'
                                defaultValue={org.name}
                            />
                        </Form.Control>
                    </Form.Field>
                    <Form.Field name='companyWebsite'>
                        <Form.Label asChild>
                            <Text as='div' size='2' mb='1' weight='bold'>
                                Company Website
                            </Text>
                        </Form.Label>
                        <Form.Control asChild>
                            <input
                                name='companyWebsite'
                                placeholder='Enter company website'
                                defaultValue={org.data?.companyWebsite}
                            />
                        </Form.Control>
                    </Form.Field>
                    <Form.Field name='logoURL'>
                        <Form.Label asChild>
                            <Text as='div' size='2' mb='1' weight='bold'>
                                Logo URL
                            </Text>
                        </Form.Label>
                        <Form.Control asChild>
                            <input
                                name='logoURL'
                                placeholder='Enter logo URL'
                                defaultValue={org.data?.logoURL}
                            />
                        </Form.Control>
                    </Form.Field>
                </Flex>

                <Flex gap='3' mt='6' justify='end'>
                    <Button color='red' onClick={onDelete}>
                        Delete Organization
                    </Button>
                    <Form.Submit asChild>
                        <Button color='green'>Update Organization</Button>
                    </Form.Submit>
                </Flex>
            </Form.Root>
        </Card>
    );
}
