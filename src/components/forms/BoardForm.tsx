'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Flex, Text, Button, TextField, TextArea } from '@radix-ui/themes';
import { Board } from '@/types/appState.type';
import { BoardSchema, BoardFormValues } from '@/schema/boardSchema';
import { Pencil2Icon } from '@radix-ui/react-icons';

export function BoardForm({
    onSubmit,
    board,
}: {
    onSubmit: (data: BoardFormValues) => void;
    board?: Board;
}) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<BoardFormValues>({
        resolver: zodResolver(BoardSchema),
        defaultValues: {
            title: board?.title ?? '',
            description: board?.description ?? '',
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Flex direction='column' gap='3'>
                <div>
                    <Text as='div' size='2' mb='1' weight='bold'>
                        Board Title
                    </Text>
                    <TextField.Root
                        {...register('title')}
                        placeholder='Enter board title'
                    />
                    {errors.title && (
                        <Text as='div' size='1' color='red'>
                            {errors.title.message}
                        </Text>
                    )}
                </div>
                <div>
                    <Text as='div' size='2' mb='1' weight='bold'>
                        Description
                    </Text>
                    <TextArea
                        {...register('description')}
                        placeholder='Enter board description'
                    />
                    {errors.description && (
                        <Text as='div' size='1' color='red'>
                            {errors.description.message}
                        </Text>
                    )}
                </div>
                <Flex justify='end' m='0'>
                    <Button
                        color='green'
                        type='submit'
                        style={{ width: 'auto' }}
                    >
                        <Pencil2Icon />
                        {board?.id ? 'Update' : 'Create'} Board
                    </Button>
                </Flex>
            </Flex>
        </form>
    );
}
