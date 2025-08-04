'use client';
import { Flex, Card, Heading, Text, Button } from '@radix-ui/themes';
import { Board } from '@/types/appState.type';
import * as Form from '@radix-ui/react-form';

export function BoardForm({
    user,
    onSubmit,
    onDelete,
    board,
}: {
    user: any;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
    onDelete?: () => Promise<void>;
    board?: Board;
}) {
    return (
        <Card size='4' style={{ width: 425, margin: '0 auto' }}>
            <Heading as='h1' size='6' align='center' mb='5'>
                {board ? 'Update' : 'Create'} Board
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
                    <Form.Field name='title'>
                        <Form.Label asChild>
                            <Text as='div' size='2' mb='1' weight='bold'>
                                Board Title
                            </Text>
                        </Form.Label>
                        <Form.Control asChild>
                            <input
                                name='title'
                                placeholder='Enter board title'
                                defaultValue={board?.title}
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
                                placeholder='Enter board description'
                                defaultValue={board?.description}
                                required
                                rows={3}
                            />
                        </Form.Control>
                    </Form.Field>
                </Flex>
                <Button color='green'>
                    {board ? 'Update' : 'Create'} Board
                </Button>
            </Form.Root>
        </Card>
    );
}
