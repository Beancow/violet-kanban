'use client';
import { useBoards } from '@/contexts/BoardsProvider';
import { BoardList, Todo } from '@/types/appState.type';
import { Button, Flex, Box, Heading, Text, Card, IconButton, Tooltip } from '@radix-ui/themes';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { deleteListAction } from '@/lib/firebase/listServerActions';
import { deleteTodoAction } from '@/lib/firebase/todoServerActions';
import { useUser } from '@/contexts/UserProvider';
import { PlusIcon, TrashIcon, DotsHorizontalIcon } from '@radix-ui/react-icons';
import { OrphanedTodosMenu } from '@/app/components/menus/OrphanedTodosMenu';
import { TodoDetails } from '@/app/components/menus/TodoDetails';
import { useState } from 'react';

export default function BoardPage() {
    const params = useParams();
    const { boardId } = params;
    const { boards, loading: boardsLoading } = useBoards();
    const { user } = useUser();
    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

    const board = boards.find((board) => board.id === boardId);

    const handleDeleteList = async (listId: string) => {
        if (user && user.currentOrganizationId) {
            await deleteListAction(user.currentOrganizationId, boardId as string, listId);
        }
    };

    const handleDeleteTodo = async (todoId: string) => {
        if (user && user.currentOrganizationId) {
            await deleteTodoAction(user.currentOrganizationId, boardId as string, todoId);
            setSelectedTodo(null);
        }
    };

    if (!board) {
        return <Text>Board not found</Text>;
    }

    if (boardsLoading) {
        return <Text>Loading...</Text>;
    }

    return (
        <Box pt='8'>
            <OrphanedTodosMenu todos={board.orphanedTodos || []} />
            <TodoDetails todo={selectedTodo} onClose={() => setSelectedTodo(null)} onDelete={handleDeleteTodo} />
            <Heading as='h1' size='6' align='center' mb='5'>
                {board.title}
            </Heading>
            <Flex direction='row' gap='4' justify='center' align='flex-start'>
                {board && board.lists && board.lists.length > 0 ? (
                    board.lists.map((list: BoardList) => (
                        <Card key={list.id} style={{ minWidth: '250px', maxWidth: '300px', flex: '1' }}>
                            <Flex direction='row' justify='between' align='center' mb='3'>
                                <Heading as='h2' size='4'>
                                    {list.title}
                                </Heading>
                                <Flex gap='2'>
                                    <Link href={`/board/${boardId}/list/${list.id}/card/create`}>
                                        <IconButton size='1' variant='soft'>
                                            <PlusIcon />
                                        </IconButton>
                                    </Link>
                                    <IconButton size='1' variant='soft' color='red' onClick={() => handleDeleteList(list.id)}>
                                        <TrashIcon />
                                    </IconButton>
                                </Flex>
                            </Flex>
                            <Flex direction='column' gap='3'>
                                {board.todos
                                    ?.filter((todo) => todo.listId === list.id)
                                    .map((todo: Todo) => (
                                        <Card key={todo.id}>
                                            <Flex direction='row' justify='between' align='center'>
                                                <Text truncate>{todo.title}</Text>
                                                <Tooltip content='Details'>
                                                    <IconButton size='1' variant='soft' onClick={() => setSelectedTodo(todo)}>
                                                        <DotsHorizontalIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Flex>
                                        </Card>
                                    ))}
                            </Flex>
                        </Card>
                    ))
                ) : (
                    <Text>No Lists found</Text>
                )}
                <Link
                    href={`/board/${board.id}/list/create`}
                    style={{
                        textDecoration: 'none',
                    }}
                >
                    <Button variant='solid' size='3'>
                        Add a List
                    </Button>
                </Link>
            </Flex>
        </Box>
    );
}
