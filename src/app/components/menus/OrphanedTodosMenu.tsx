'use client';
import { useState } from 'react';
import { Box, Card, Text, Flex, Tooltip, IconButton } from '@radix-ui/themes';
import { Todo } from '@/types/appState.type';
import { ChevronRightIcon, Cross1Icon } from '@radix-ui/react-icons';

export function OrphanedTodosMenu({ todos }: { todos: Todo[] }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Box
            style={{
                position: 'fixed',
                left: isOpen ? 0 : '-250px',
                top: 0,
                height: '100vh',
                width: '250px',
                backgroundColor: 'var(--gray-2)',
                transition: 'left 0.3s ease-in-out',
                zIndex: 1000,
            }}
        >
            <Tooltip content={isOpen ? 'Close orphaned cards' : 'Show orphaned cards'}>
                <IconButton
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        position: 'absolute',
                        right: '-50px',
                        top: '20px',
                    }}
                >
                    {isOpen ? <Cross1Icon /> : <ChevronRightIcon />}
                </IconButton>
            </Tooltip>
            <Box p='4'>
                <Text size='4' weight='bold' mb='4'>
                    Orphaned Cards
                </Text>
                <Flex direction='column' gap='3'>
                    {todos.map((todo) => (
                        <Card key={todo.id}>
                            <Text>{todo.title}</Text>
                        </Card>
                    ))}
                </Flex>
            </Box>
        </Box>
    );
}
