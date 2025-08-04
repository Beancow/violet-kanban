'use client';
import { useUser } from '@/contexts/UserProvider';
import { useOrganizations } from '@/contexts/OrganizationsProvider';
import { useBoards } from '@/contexts/BoardsProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, Heading, Text, Button, Flex } from '@radix-ui/themes';
import Link from 'next/link';

export default function UserBoardsPage() {
    const { user, setCurrentBoard } = useUser();
    const { organizations, loading: orgsLoading } = useOrganizations();
    const { boards, loading: boardsLoading } = useBoards();
    const router = useRouter();

    if (orgsLoading || boardsLoading) {
        return <Text>Loading boards...</Text>;
    }

    const handleCreateListClick = (boardId: string) => {
        setCurrentBoard(boardId);
        router.push(`/board/${boardId}`);
    };

    if (!organizations.length) {
        return (
            <Box key='no-orgs'>
                <Text>An Organisation is required to view boards.</Text>;
                <Button
                    onClick={() => router.push('/org/create')}
                    variant='solid'
                    color='blue'
                >
                    Create Organisation
                </Button>
            </Box>
        );
    }

    useEffect(() => {
        if (!orgsLoading && (!user || !user.currentOrganizationId))
            router.push('/user/login');
    }, [user, orgsLoading]);

    if (!user || !user.currentOrganizationId) {
        return null;
    }

    const currentOrg = organizations.find(
        (org) => org.id === user.currentOrganizationId
    );
    const orgBoards = boards.filter(
        (board) => board.organizationId === user.currentOrganizationId
    );

    return (
        <Box pt='8'>
            <Heading as='h1' size='6' align='center' mb='5'>
                {currentOrg ? `${currentOrg.name} Boards` : 'Your Boards'}
            </Heading>
            <Flex direction='column' gap='4' align='center'>
                {orgBoards.length > 0 ?
                    orgBoards.map((board) => (
                        <Link
                            href={`/board/${board.id}`}
                            key={board.id}
                            style={{
                                textDecoration: 'none',
                                width: '100%',
                                maxWidth: '500px',
                            }}
                        >
                            <Button
                                variant='soft'
                                size='3'
                                style={{ width: '100%' }}
                            >
                                {board.title}
                            </Button>
                        </Link>
                    ))
                :   <Text>No boards found for this organization.</Text>}
                <Link
                    href='/board/create'
                    style={{
                        textDecoration: 'none',
                        width: '100%',
                        maxWidth: '500px',
                    }}
                >
                    <Button variant='solid' size='3' style={{ width: '100%' }}>
                        Create New Board
                    </Button>
                </Link>
            </Flex>
        </Box>
    );
}
