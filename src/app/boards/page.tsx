'use client';
import { useState } from 'react';
import { useOrganizationStore } from '@/store/organizationStore';
import {
    useVioletKanbanData,
    useVioletKanbanEnqueueBoardAction,
    useVioletKanbanRemoveBoardAction,
} from '@/store/useVioletKanbanHooks';

import { Heading, Text, Button, Flex, IconButton } from '@radix-ui/themes';
import { TrashIcon, PlusIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import LoadingPage from '@/components/LoadingPage';
import OrganizationGate from '@/components/guards/OrganizationGate';
import CreateBoardModal from '@/components/modals/CreateBoardModal';
import { Board } from '@/types/appState.type';
import type { BoardFormValues } from '@/schema/boardSchema';

export default function UserBoardsPage() {
    const currentOrganizationId = useOrganizationStore(
        (s) => s.currentOrganizationId
    );
    const organizations = useOrganizationStore((s) => s.organizations);
    const orgsLoading = useOrganizationStore((s) => s.loading);
    const { boards } = useVioletKanbanData();
    const enqueueBoardAction = useVioletKanbanEnqueueBoardAction();
    const removeBoardAction = useVioletKanbanRemoveBoardAction();

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
            enqueueBoardAction({
                type: 'delete-board',
                payload: { id: boardId },
                timestamp: Date.now(),
            });
        }
    };

    const handleCreateBoard = async (data: BoardFormValues) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        const tempId = `temp-board-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;
        enqueueBoardAction({
            type: 'create-board',
            payload: {
                data: {
                    ...data,
                    organizationId: currentOrganizationId || '',
                },
                tempId,
            },
            timestamp: Date.now(),
        });
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
