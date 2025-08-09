
'use client';

import { Board, BoardCard, BoardList } from '@/types/appState.type';
import { Box, Text, Dialog } from '@radix-ui/themes';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserProvider';
import { useData } from '@/contexts/DataProvider';
import { LooseCardsMenu } from '@/app/components/menus/LooseCardsMenu';
import { CardDetails } from '@/app/components/menus/CardDetails';
import { useState, useEffect, useCallback } from 'react';
import { useAppToast } from '@/hooks/useToast';
import OrganizationGate from '@/app/components/guards/OrganizationGate';
import BoardContent from '@/app/components/board/BoardContent';
import LoadingPage from '@/components/LoadingPage';
import { ListForm } from '@/app/components/forms/ListForm';

export default function BoardPage() {
    const params = useParams();
    const { boardId } = params;
    const { user } = useUser();
    const { boards, lists, cards, createList, deleteList, createCard, deleteCard, restoreCard, updateCardOrder, updateList, setIsEditing, actionQueue } = useData();
    const router = useRouter();
    const [board, setBoard] = useState<Board | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCard, setSelectedCard] = useState<BoardCard | null>(null);
    const [editingList, setEditingList] = useState<BoardList | null>(null);
    const [showAddCardDialog, setShowAddCardDialog] = useState<string | null>(null);
    const [showAddListDialog, setShowAddListDialog] = useState(false);
    const { showToast } = useAppToast();

    useEffect(() => {
        if (typeof boardId === 'string' && boardId.startsWith('temp_')) {
            const actionInQueue = actionQueue.find(a => a.payload.tempId === boardId);
            if (!actionInQueue) {
                // The action is no longer in the queue, so the board should be reconciled.
                // We need to find the permanent board to redirect to.
                // This is tricky. Let's find the optimistic board first.
                const optimisticBoard = boards.find(b => b.id === boardId);
                if (!optimisticBoard) {
                    // It's gone, which means it was likely reconciled.
                    // We can't easily find the new ID without more info.
                    // A full solution would store a map of tempId -> newId.
                    // For now, let's push the user back to the boards page.
                    router.push('/boards');
                }
            }
        }
    }, [boardId, actionQueue, boards, router]);

    useEffect(() => {
        setIsEditing(showAddCardDialog !== null || showAddListDialog);
    }, [showAddCardDialog, showAddListDialog, setIsEditing]);

    useEffect(() => {
        if (boards) {
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
    }, [boards, lists, cards, boardId]);

    const handleCreateList = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user || !boardId) {
            showToast('Error', 'You must be logged in to create a list.');
            return;
        }

        const formData = new FormData(event.currentTarget);
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        
        createList(boardId as string, title, description, board?.lists?.length || 0);

        showToast('Success', 'List added to queue!');
        setShowAddListDialog(false);
    };

    const handleEditList = (list: BoardList) => {
        setEditingList(list);
    };

    const handleUpdateList = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user || !boardId || !editingList) {
            showToast('Error', 'You must be logged in to update a list.');
            return;
        }

        const formData = new FormData(event.currentTarget);
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        
        updateList(boardId as string, editingList.id, { title, description });

        showToast('Success', 'List update added to queue!');
        setEditingList(null);
    };

    const handleDeleteList = (listId: string) => {
        if (!boardId) return;
        deleteList(boardId as string, listId);
        showToast('Success', 'List deletion added to queue!');
    };

    const handleUpdateListTitle = (listId: string, newTitle: string) => {
        if (!boardId) return;
        updateList(boardId as string, listId, { title: newTitle });
        showToast('Success', 'List title update added to queue!');
    };

    const handleCreateCard = async (
        event: React.FormEvent<HTMLFormElement>,
        listId: string
    ) => {
        event.preventDefault();
        if (!user || !boardId) {
            showToast('Error', 'You must be logged in to create a card.');
            return;
        }

        const formData = new FormData(event.currentTarget);
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        
        createCard(listId, boardId as string, title, description, board?.cards?.length || 0);

        showToast('Success', 'Card added to queue!');
        setShowAddCardDialog(null);
    };

    const handleDeleteCard = async (cardId: string) => {
        if (!boardId) return;
        deleteCard(boardId as string, cardId);
        showToast('Success', 'Card deletion added to queue!');
        setSelectedCard(null);
    };

    const handleRestoreCard = async (cardId: string) => {
        if (!boardId) return;
        restoreCard(boardId as string, cardId);
        showToast('Success', 'Card restoration added to queue!');
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

        // Call the new sync provider method
        updateCardOrder(boardId as string, newOrder);
        showToast('Success', 'Card reordering added to queue!');
    }, [board, boardId, updateCardOrder, showToast]);
    
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
                    onUpdateListTitle={handleUpdateListTitle}
                    onEditList={handleEditList}
                />
                <Dialog.Root open={editingList !== null} onOpenChange={() => setEditingList(null)}>
                    <Dialog.Content style={{ maxWidth: 450 }}>
                        <Dialog.Title>Edit List</Dialog.Title>
                        <ListForm
                            user={user}
                            onSubmit={handleUpdateList}
                            list={editingList}
                        />
                    </Dialog.Content>
                </Dialog.Root>
            </Box>
        </OrganizationGate>
    );
}
