'use client';
import { useOrganizations } from '@/contexts/OrganizationsProvider';
import { useData } from '@/contexts/DataProvider';
import { useAuth } from '@/contexts/AuthProvider';

import { Box, Heading, Text, Button, Flex, IconButton } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import LoadingPage from '@/components/LoadingPage';
import OrganizationGate from '@/app/components/guards/OrganizationGate';

export default function UserBoardsPage() {
    const { currentOrganizationId, organizations, loading: orgsLoading } = useOrganizations();
    const { boards } = useData();
    const { authUser } = useAuth();
    const { deleteBoard } = useData();
    
    const currentOrg = organizations.find(
        (org) => org.id === currentOrganizationId
    );

    const userRole = currentOrg?.members?.[authUser?.uid || '']?.role;
    const canDelete = userRole === 'owner' || userRole === 'admin';

    const handleDelete = (e: React.MouseEvent, boardId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
            deleteBoard(boardId);
        }
    };

    if (orgsLoading) {
        return <LoadingPage dataType='boards' />;
    }

    return (
        <OrganizationGate>
            <Box pt='8'>
                <Heading as='h1' size='6' align='center' mb='5'>
                    {`${currentOrg?.name ?? 'Your'} Boards`}
                </Heading>
                <Flex direction='column' gap='4' align='center'>
                    {boards.length > 0 ? (
                        boards.map((board) => (
                            <Flex key={board.id} align="center" gap="3" style={{ width: '100%', maxWidth: '550px' }}>
                                <Link
                                    href={`/board/${board.id}`}
                                    style={{
                                        textDecoration: 'none',
                                        flexGrow: 1,
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
                                {canDelete && (
                                    <IconButton
                                        color="red"
                                        variant="soft"
                                        onClick={(e) => handleDelete(e, board.id)}
                                        aria-label="Delete board"
                                    >
                                        <TrashIcon />
                                    </IconButton>
                                )}
                            </Flex>
                        ))
                    ) : (
                        <Text>No boards found for this organization.</Text>
                    )}
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
        </OrganizationGate>
    );
}