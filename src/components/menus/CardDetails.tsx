'use client';
import { Box, Card, Flex, Button } from '@radix-ui/themes';
import { BoardCard } from '@/types/appState.type';
import { TrashIcon } from '@radix-ui/react-icons';
import { CardForm } from '../forms/CardForm';
import { safeParse } from 'zod';
import { boardCardSchema } from '@/schema/boardCardSchema';

export function CardDetails({
    card,
    onDelete,
    onClose,
}: {
    card: BoardCard | null;
    onDelete: (cardId: string) => void;
    onClose: () => void;
}) {
    if (!card) return null;

    return (
        <Box
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
            }}
        >
            <Card style={{ minWidth: '300px', maxWidth: '500px' }}>
                <CardForm
                    card={card}
                    onSubmit={(data) => {}}
                    onClose={onClose}
                />
                <Flex justify='end' mt='4'>
                    <Button color='red' onClick={() => onDelete(card.id)}>
                        <TrashIcon />
                        Delete Card
                    </Button>
                </Flex>
            </Card>
        </Box>
    );
}
