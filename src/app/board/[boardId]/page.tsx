import { Board, BoardCard } from '@/types/appState.type';
import { Box, Text } from '@radix-ui/themes';
import { useParams } from 'next/navigation';
import { useBoardData } from '@/contexts/BoardDataProvider';
import { useUser } from '@/contexts/UserProvider';
import { useAuth } from '@/contexts/AuthProvider';
import { useSync } from '@/contexts/SyncProvider';
import { LooseCardsMenu } from '@/app/components/menus/LooseCardsMenu';
import { CardDetails } from '@/app/components/menus/CardDetails';
import { useState, useEffect, useCallback } from 'react';


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

    const { boards, loading: boardsLoading, handleDeleteList, handleUpdateCard } = useBoardData();

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

    const handleUpdateCardOrder = useCallback(async (listId: string, newOrder: string[]) => {
        if (!board) return;

        const updatedCards = newOrder.map((cardId, index) => {
            const card = board.cards?.find(c => c.id === cardId);
            if (card) {
                return { ...card, priority: index };
            }
            return card;
        }).filter(Boolean) as BoardCard[];

        // Update local state optimistically
        setBoard(prevBoard => prevBoard ? { ...prevBoard, cards: updatedCards } : null);

        // Update backend
        for (const [index, cardId] of newOrder.entries()) {
            await handleUpdateCard(boardId as string, cardId, { priority: index });
        }
    }, [board, boardId, handleUpdateCard]);

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
                onUpdateCardOrder={handleUpdateCardOrder}
            />
        </Box>
    );
}
