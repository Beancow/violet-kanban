'use client';
import { Box, Card, Text, Flex, IconButton, Button } from '@radix-ui/themes';
import { BoardCard } from '@/types/appState.type';
import { Cross1Icon, TrashIcon } from '@radix-ui/react-icons';

export function CardDetails({
    card,
    onClose,
    onDelete
}: {
    card: BoardCard | null,
    onClose: () => void,
    onDelete: (cardId: string) => void
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
                <Flex direction='row' justify='between' align='center' mb='3'>
                    <Text size='4' weight='bold'>
                        {card.title}
                    </Text>
                    <IconButton onClick={onClose} size='1' variant='soft'>
                        <Cross1Icon />
                    </IconButton>
                </Flex>
                <Text>{card.description}</Text>
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