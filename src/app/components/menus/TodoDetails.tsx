'use client';
import { Box, Card, Text, Flex, IconButton, Button } from '@radix-ui/themes';
import { Todo } from '@/types/appState.type';
import { Cross1Icon, TrashIcon } from '@radix-ui/react-icons';
import { useUser } from '@/contexts/UserProvider';

export function TodoDetails({ 
    todo,
    onClose,
    onDelete
}: { 
    todo: Todo | null, 
    onClose: () => void,
    onDelete: (todoId: string) => void
}) {
    const { user } = useUser();
    if (!todo) return null;

    const isEditor = user?.currentOrganization?.role === 'editor' || user?.currentOrganization?.role === 'owner';

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
                        {todo.title}
                    </Text>
                    <IconButton onClick={onClose} size='1' variant='soft'>
                        <Cross1Icon />
                    </IconButton>
                </Flex>
                <Text>{todo.description}</Text>
                {isEditor && (
                    <Flex justify='end' mt='4'>
                        <Button color='red' onClick={() => onDelete(todo.id)}>
                            <TrashIcon />
                            Delete Card
                        </Button>
                    </Flex>
                )}
            </Card>
        </Box>
    );
}
