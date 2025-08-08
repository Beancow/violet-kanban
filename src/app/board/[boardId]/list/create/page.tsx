'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserProvider';
import { createListAction } from '@/lib/firebase/listServerActions';
import { Button, Flex, Card, Heading, Text } from '@radix-ui/themes';
import * as Form from '@radix-ui/react-form';
import { useBoards } from '@/contexts/BoardsProvider';

import { useRequireOrganization } from '@/hooks/useRequireOrganization';

export default function CreateListPage() {
    useRequireOrganization();
    const params = useParams();
    const router = useRouter();
    const { boardId } = params;
    const { user, currentOrganizationId } = useUser();
    const { addListToBoard } = useBoards();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateList = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        if (!user || !user.id || !currentOrganizationId || !boardId) {
            setError('User, organization, or board information is missing.');
            setLoading(false);
            return;
        }

        const formData = new FormData(event.currentTarget);

        try {
            const {
                success,
                error: createError,
                data: newList,
            } = await createListAction({
                data: formData,
                uid: user.id,
                orgId: currentOrganizationId,
                boardId: boardId as string,
            });

            if (success && newList) {
                addListToBoard(boardId as string, newList);
                router.push(`/board/${boardId}`);
            } else {
                setError(createError?.message || 'Failed to create list.');
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || 'An unexpected error occurred.');
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card size='4' style={{ width: 425, margin: '0 auto' }}>
            <Heading as='h1' size='6' align='center' mb='5'>
                Create New List
            </Heading>

            <Form.Root onSubmit={handleCreateList}>
                <Flex direction='column' gap='3'>
                    <Form.Field name='title'>
                        <Form.Label asChild>
                            <Text as='div' size='2' mb='1' weight='bold'>
                                List Title
                            </Text>
                        </Form.Label>
                        <Form.Control asChild>
                            <input
                                name='title'
                                placeholder='Enter list title'
                                required
                            />
                        </Form.Control>
                    </Form.Field>
                    <Form.Field name='description'>
                        <Form.Label asChild>
                            <Text as='div' size='2' mb='1' weight='bold'>
                                Description
                            </Text>
                        </Form.Label>
                        <Form.Control asChild>
                            <textarea
                                name='description'
                                placeholder='Enter list description'
                            />
                        </Form.Control>
                    </Form.Field>
                </Flex>

                {error && (
                    <Text color='red' mt='3'>
                        {error}
                    </Text>
                )}

                <Flex gap='3' mt='6' justify='end'>
                    <Button type='submit' disabled={loading}>
                        {loading ? 'Creating...' : 'Create List'}
                    </Button>
                </Flex>
            </Form.Root>
        </Card>
    );
}
