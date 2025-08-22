'use client';
import { Flex, Text, Button, TextField, TextArea } from '@radix-ui/themes';
import type { UseFormReturn } from 'react-hook-form';
import { Board } from '@/types/appState.type';
import type { BoardFormValues } from '@/schema/boardSchema';
import { Pencil2Icon } from '@radix-ui/react-icons';

export function BoardForm({
    onSubmit,
    board,
    form,
}: {
    onSubmit: (data: BoardFormValues) => void;
    board?: Board;
    form: UseFormReturn<BoardFormValues>;
}) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = form;

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
