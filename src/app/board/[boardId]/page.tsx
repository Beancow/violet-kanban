'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@/contexts/UserProvider';
import { useBoards } from '@/contexts/BoardsProvider';
import { BoardList } from '@/types/appState.type';
import { getListsAction } from '@/lib/firebase/listServerActions';
import { Button, Flex, Box, Heading, Text } from '@radix-ui/themes';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function BoardPage() {
    const params = useParams();
    const { boardId } = params;
    const { user } = useUser();
    const { boards } = useBoards();
    const [lists, setLists] = useState<BoardList[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLists = async () => {
            if (user && user.currentOrganizationId) {
                const { data, success } = await getListsAction(
                    user.currentOrganizationId,
                    boardId as string
                );
                if (success && data) {
                    setLists(data);
                }
                setLoading(false);
            }
        };
        fetchLists();
    }, [user, boardId]);

    const board = boards.find((board) => board.id === boardId);

    if (!board) {
        return <Text>Board not found</Text>;
    }

    if (loading) {
        return <Text>Loading lists...</Text>;
    }

    return (
        <Box pt='8'>
            <Heading as='h1' size='6' align='center' mb='5'>
                {board.title}
            </Heading>
            <Flex direction='column' gap='4' align='center'>
                {lists.length > 0 ?
                    lists.map((list: BoardList) => (
                        <Link
                            href={`/board/${board.id}/list/${list.id}`}
                            key={list.id}
                            style={{
                                textDecoration: 'none',
                                width: '100%',
                                maxWidth: '500px',
                            }}
                        >
                            <Button
                                key={list.id}
                                variant='soft'
                                size='3'
                                style={{ width: '100%' }}
                            >
                                {list.title}
                            </Button>
                        </Link>
                    ))
                :   <Text>No lists found for this board.</Text>}
                <Link
                    href={`/board/${board.id}/list/create`}
                    style={{
                        textDecoration: 'none',
                        width: '100%',
                        maxWidth: '500px',
                    }}
                >
                    <Button variant='solid' size='3' style={{ width: '100%' }}>
                        Create New List
                    </Button>
                </Link>
            </Flex>
        </Box>
    );
}
