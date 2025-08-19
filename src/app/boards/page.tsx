'use client';
import { useState } from 'react';
import { useOrganizations } from '@/contexts/OrganizationsProvider';
import { useData } from '@/contexts/DataProvider';
import { useAuth } from '@/contexts/AuthProvider';

import { Box, Heading, Text, Button, Flex, IconButton } from '@radix-ui/themes';
import { TrashIcon, PlusIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import LoadingPage from '@/components/LoadingPage';
import OrganizationGate from '@/components/guards/OrganizationGate';
import CreateBoardModal from '@/components/modals/CreateBoardModal';

export default function UserBoardsPage() {
    const {
        currentOrganizationId,
        organizations,
        loading: orgsLoading,
    } = useOrganizations();
    const { boards, createBoard, deleteBoard } = useData();
    const { authUser } = useAuth();

    const [modalOpen, setModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentOrg = organizations.find(
        (org) => org.id === currentOrganizationId
    );

    const handleDelete = (e: React.MouseEvent, boardId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (
            window.confirm(
                'Are you sure you want to delete this board? This action cannot be undone.'
            )
        ) {
            deleteBoard(boardId);
        }
    };

    const handleCreateBoard = async (data: {
        title: string;
        description: string;
    }) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        createBoard(data.title, data.description);

        setIsSubmitting(false);
        setModalOpen(false);
    };

    if (orgsLoading) {
        return <LoadingPage dataType='boards' />;
    }

    return (
        <OrganizationGate>
            <Flex pt='8' direction='column' position='relative'>
                <Flex justify='end' mx='6'>
                    <Button
                        color='green'
                        variant='solid'
                        onClick={() => setModalOpen(true)}
                        aria-label='Create New Board'
                    >
                        <PlusIcon /> Create New Board
                    </Button>
                </Flex>
                <Heading as='h1' size='6' mb='5' align='center'>
                    {`${currentOrg?.name ?? 'Your'} Boards`}
                </Heading>
                <Flex direction='column' gap='4' align='center'>
                    {boards.length > 0 ? (
                        boards.map((board) => (
                            <Flex
                                key={board.id}
                                align='center'
                                gap='3'
                                style={{ width: '100%', maxWidth: '550px' }}
                            >
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

                                <IconButton
                                    color='red'
                                    variant='soft'
                                    onClick={(e) => handleDelete(e, board.id)}
                                    aria-label='Delete board'
                                >
                                    <TrashIcon />
                                </IconButton>
                            </Flex>
                        ))
                    ) : (
                        <Text>No boards found for this organization.</Text>
                    )}
                </Flex>
                <CreateBoardModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    onSubmit={handleCreateBoard}
                    isSubmitting={isSubmitting}
                />
            </Flex>
        </OrganizationGate>
    );
}
