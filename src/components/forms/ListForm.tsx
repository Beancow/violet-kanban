'use client';
import {
    Flex,
    Card,
    Heading,
    Text,
    Button,
    TextField,
    TextArea,
} from '@radix-ui/themes';
import { BoardList, User } from '@/types/appState.type';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BoardListSchema, BoardListFormValues } from '@/schema/boardListSchema';

export function ListForm({
    user,
    onSubmit,
    list,
}: {
    user: User | null;
    onSubmit: (data: BoardListFormValues) => void;
    list?: BoardList;
}) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<BoardListFormValues>({
        resolver: zodResolver(BoardListSchema),
        defaultValues: {
            title: list?.title || '',
            description: list?.description || '',
            position: list?.position ?? 0,
            boardId: list?.boardId ?? '',
        },
    });

    return (
        <Card size='4' style={{ width: 425, margin: '0 auto' }}>
            <Heading as='h1' size='6' align='center' mb='5'>
                {list ? 'Update' : 'Create'} List
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

            <form onSubmit={handleSubmit(onSubmit)}>
                <Flex direction='column' gap='3'>
                    <label>
                        <Text as='div' size='2' mb='1' weight='bold'>
                            List Title
                        </Text>
                        <TextField.Root
                            {...register('title')}
                            placeholder='Enter list title'
                        />
                        {errors.title && (
                            <Text color='red' size='1'>
                                {errors.title.message}
                            </Text>
                        )}
                    </label>
                    <label>
                        <Text as='div' size='2' mb='1' weight='bold'>
                            Description
                        </Text>
                        <TextArea
                            {...register('description')}
                            placeholder='Enter list description'
                        />
                        {errors.description && (
                            <Text color='red' size='1'>
                                {errors.description.message}
                            </Text>
                        )}
                    </label>
                </Flex>
                <Button color='green' type='submit'>
                    {list ? 'Update' : 'Create'} List
                </Button>
            </form>
        </Card>
    );
}
