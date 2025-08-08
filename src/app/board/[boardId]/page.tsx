import { Board, BoardCard } from '@/types/appState.type';
import { Box, Text } from '@radix-ui/themes';
import { useParams } from 'next/navigation';
import { useBoardData } from '@/contexts/BoardDataProvider';
import { useUser } from '@/contexts/UserProvider';
import { useAuth } from '@/contexts/AuthProvider';
import { useSync } from '@/contexts/SyncProvider';
import { LooseCardsMenu } from '@/app/components/menus/LooseCardsMenu';
import { CardDetails } from '@/app/components/menus/CardDetails';
import { useState, useEffect } from 'react';
import { DragEndEvent } from '@dnd-kit/core';

import { useRequireOrganization } from '@/hooks/useRequireOrganization';
import BoardContent from '@/app/components/board/BoardContent';
import LoadingPage from '@/components/LoadingPage';

export default function BoardPage() {
    useRequireOrganization();
    const params = useParams();
    const { boardId } = params;
    const { currentOrganizationId, user } = useUser();
    const { authUser } = useAuth();
    const { setIsEditing } = useSync();
    const [board, setBoard] = useState<Board | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCard, setSelectedCard] = useState<BoardCard | null>(null);
    const [showAddCardDialog, setShowAddCardDialog] = useState<string | null>(
        null
    ); // State to control which list's dialog is open

    useEffect(() => {
        setIsEditing(showAddCardDialog !== null);
    }, [showAddCardDialog, setIsEditing]);

    const { boards, loading: boardsLoading, handleDeleteList } = useBoardData();

    useEffect(() => {
        if (!boardsLoading && boards) {
            const currentBoard = boards.find(b => b.id === boardId);
            setBoard(currentBoard || null);
            setLoading(false);
        }
    }, [boards, boardsLoading, boardId]);

    const handleCreateCard = async (
        event: React.FormEvent<HTMLFormElement>,
        listId: string
    ) => {
        event.preventDefault();
        if (!user || !currentOrganizationId || !authUser) {
            alert(
                'You must be logged in and belong to an organization to create a card.'
            );
            return;
        }

        const response = await fetch('/api/cards/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
                'X-Organization-Id': currentOrganizationId || '',
            },
            body: JSON.stringify({
                data,
                boardId: boardId as string,
                listId: listId as string,
            }),
        });

        const result = await response.json();

        if (result.success && result.data) {
            // You might want to update the local board state here
            setShowAddCardDialog(null); // Close the dialog on successful creation
        } else {
            console.error('Error creating card:', result.error);
        }
    };

    const handleDeleteCard = async (cardId: string) => {
        if (currentOrganizationId) {
            const response = await fetch('/api/cards/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orgId: currentOrganizationId,
                    boardId: boardId as string,
                    cardId,
                }),
            });

            const result = await response.json();

            if (result.success) {
                // You might want to update the local board state here
                setSelectedCard(null);
            }
        }
    };

    const handleRestoreCard = async (cardId: string) => {
        if (currentOrganizationId) {
            const response = await fetch('/api/cards/restore', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orgId: currentOrganizationId,
                    boardId: boardId as string,
                    cardId,
                }),
            });

            const result = await response.json();

            if (result.success) {
                // You might want to update the local board state here
            }
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!board || !currentOrganizationId) {
            console.log(
                'Pre-conditions not met: board or organization missing.'
            );
            return;
        }

        const activeCard = board.cards?.find((card) => card.id === active.id);
        if (!activeCard) {
            console.log('Active card not found.');
            return;
        }

        if (over) {
            const potentialDestinationId =
                over.data.current?.sortable?.containerId || over.id;
            const validList = board.lists?.find(
                (list) => list.id === potentialDestinationId
            );
            if (validList) {
                // destinationListId = validList.id;
            }
        }

        // Optimistically update the UI (no local state update needed as we refetch)

        // Then, update the backend
        try {
            // Assuming updateCardListIdServerAction is available and handles the update
            // This would need to be exposed via an API route as well.
            // For now, we'll keep the direct call for simplicity, but ideally it would go through an API route.
            // await updateCardListIdServerAction(
            //     currentOrganizationId,
            //     board.id,
            //     activeCard.id,
            //     destinationListId
            // );
            // No need to re-fetch or re-set state here as we're optimistic
        } catch (error) {
            console.error('Failed to update card position:', error);
            // Revert the UI change on failure
            alert('Failed to move card. Please try again.');
        }
    };

    if (loading) {
        return <LoadingPage dataType="Board" />;
    }

    if (!board) {
        return <Text>Board not found</Text>;
    }

    return (
        <Box>
            <LooseCardsMenu
                cards={board.cards || []}
                onRestore={handleRestoreCard}
                onSelectCard={setSelectedCard}
            />
            <CardDetails
                card={selectedCard}
                onClose={() => setSelectedCard(null)}
                onDelete={handleDeleteCard}
            />
            <BoardContent
                board={board}
                user={user}
                onDeleteList={handleDeleteList}
                onSelectCard={setSelectedCard}
                onCreateCard={handleCreateCard}
                showAddCardDialog={showAddCardDialog}
                setShowAddCardDialog={setShowAddCardDialog}
                onDragEnd={handleDragEnd}
            />
        </Box>
    );
}
