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
import type { UseFormReturn } from 'react-hook-form';
import { boardCardSchema } from '@/schema/boardCardSchema';
type BoardCardFormValues = import('zod').z.infer<typeof boardCardSchema>;
import styles from '@/components/menus/LooseCardsMenu.module.css';
import { BoardCard } from '@/types/appState.type';

export function CardForm({
    card,
    form,
    onSubmit,
}: {
    card?: BoardCard;
    form: UseFormReturn<BoardCardFormValues>;
    onSubmit: (data: BoardCardFormValues) => void;
}) {
    const {
        register,
        formState: { errors },
        handleSubmit,
    } = form;

    return (
        <Card className={styles.card}>
            <Heading as='h1' size='6' align='center' mb='5'>
                {card?.id ? 'Update' : 'Create'} Card
            </Heading>

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
