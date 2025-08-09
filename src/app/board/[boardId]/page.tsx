
'use client';

import { Board, BoardCard } from '@/types/appState.type';
import { Box, Text } from '@radix-ui/themes';
import { useParams } from 'next/navigation';
import { useBoardData } from '@/contexts/BoardDataProvider';
import { useOrganizations } from '@/contexts/OrganizationsProvider';
import { useUser } from '@/contexts/UserProvider';
import { useAuth } from '@/contexts/AuthProvider';
import { useSync } from '@/contexts/SyncProvider';
import { LooseCardsMenu } from '@/app/components/menus/LooseCardsMenu';
import { CardDetails } from '@/app/components/menus/CardDetails';
import { useState, useEffect, useCallback } from 'react';
import { useAppToast } from '@/hooks/useToast';
import OrganizationGate from '@/app/components/guards/OrganizationGate';
import BoardContent from '@/app/components/board/BoardContent';
import LoadingPage from '@/components/LoadingPage';

export default function BoardPage() {
    const params = useParams();
    const { boardId } = params;
    const { user } = useUser();
    const { authUser } = useAuth();
    const { currentOrganizationId } = useOrganizations();
    const { addActionToQueue, setIsEditing } = useSync();
    const [board, setBoard] = useState<Board | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCard, setSelectedCard] = useState<BoardCard | null>(null);
    const [showAddCardDialog, setShowAddCardDialog] = useState<string | null>(null);
    const [showAddListDialog, setShowAddListDialog] = useState(false);
    const { showToast } = useAppToast();

    useEffect(() => {
        setIsEditing(showAddCardDialog !== null || showAddListDialog);
    }, [showAddCardDialog, showAddListDialog, setIsEditing]);

    const { boards, lists, cards, loading: boardsLoading, handleDeleteList, handleUpdateCard } = useBoardData();

    useEffect(() => {
        if (!boardsLoading && boards) {
            const currentBoard = boards.find(b => b.id === boardId);
            if (currentBoard) {
                const boardLists = lists.filter(l => l.boardId === currentBoard.id);
                const boardCards = cards.filter(c => c.boardId === currentBoard.id);
                setBoard({ ...currentBoard, lists: boardLists, cards: boardCards });
            } else {
                setBoard(null);
            }
            setLoading(false);
        }
    }, [boards, lists, cards, boardsLoading, boardId]);

    const handleCreateList = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user || !boardId) {
            showToast('Error', 'You must be logged in to create a list.');
            return;
        }

        const formData = new FormData(event.currentTarget);
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const tempId = `temp-${Date.now()}`;

        const newList: Omit<List, 'id'> = {
            title,
            description,
            position: board?.lists?.length || 0,
            boardId: boardId as string,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        addActionToQueue({
            type: 'create-list',
            payload: {
                boardId: boardId as string,
                data: { ...newList, id: tempId },
            },
            timestamp: Date.now(),
        });

        showToast('Success', 'List added to queue!');
        setShowAddListDialog(false);
    };

    const handleCreateCard = async (
        event: React.FormEvent<HTMLFormElement>,
        listId: string
    ) => {
        event.preventDefault();
        if (!user || !currentOrganizationId || !authUser) {
            showToast(
                'Error',
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
        <OrganizationGate>
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
                    onCreateList={handleCreateList}
                    showAddCardDialog={showAddCardDialog}
                    setShowAddCardDialog={setShowAddCardDialog}
                    showAddListDialog={showAddListDialog}
                    setShowAddListDialog={setShowAddListDialog}
                    onUpdateCardOrder={handleUpdateCardOrder}
                />
            </Box>
        </OrganizationGate>
    );
}
