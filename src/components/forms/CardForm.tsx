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
import { BoardCard } from '@/types/appState.type';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { boardCardSchema } from '@/schema/boardCardSchema';
import styles from 'src/components/menus/LooseCardsMenu.module.css';

export function CardForm({
    card,
    onSubmit,
    onClose,
    hideTitle = false,
    small = false,
}: {
    card?: BoardCard;
    onSubmit: (data: any) => void;
    onClose: () => void;
    hideTitle?: boolean;
    small?: boolean;
}) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(boardCardSchema),
        defaultValues: {
            title: card?.title || '',
            description: card?.description || '',
            priority: card?.priority ?? 0,
            listId: card?.listId ?? null,
            boardId: card?.boardId ?? '',
            organizationId: card?.organizationId ?? '',
        },
    });

    return (
        <Card size={small ? '2' : '4'} className={styles.card}>
            {/* Only show title and close if not hidden */}
            {!hideTitle && (
                <Heading as='h1' size='6' align='center' mb='5'>
                    {card?.id ? 'Update' : 'Create'} Card
                </Heading>
            )}
            <form onSubmit={handleSubmit(onSubmit)}>
                <Flex direction='column' gap='3'>
                    <label>
                        <Text as='div' size='2' mb='1' weight='bold'>
                            Card Title
                        </Text>
                        <TextField.Root
                            {...register('title')}
                            placeholder='Enter card title'
                        />
                        {errors.title && (
                            <Text color='red' size='1'>
                                {errors.title.message as string}
                            </Text>
                        )}
                    </label>
                    <label>
                        <Text as='div' size='2' mb='1' weight='bold'>
                            Description
                        </Text>
                        <TextArea
                            {...register('description')}
                            placeholder='Enter card description'
                        />
                        {errors.description && (
                            <Text color='red' size='1'>
                                {errors.description.message as string}
                            </Text>
                        )}
                    </label>
                </Flex>
                <Button color='green' type='submit'>
                    {card?.id ? 'Update' : 'Create'} Card
                </Button>
            </form>
        </Card>
    );
}
