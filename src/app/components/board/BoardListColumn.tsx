'use client';
import { BoardList, BoardCard, User } from '@/types/appState.type';
import {
    Card,
    Flex,
    Heading,
    IconButton,
    Dialog,
} from '@radix-ui/themes';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import BoardCardItem from './BoardCardItem';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { CardForm } from '@/app/components/forms/CardForm';
import { useState } from 'react';

interface BoardListColumnProps {
    list: BoardList;
    cards: BoardCard[];
    user: User | null;
    onDeleteList: (listId: string) => void;
    onSelectCard: (card: BoardCard) => void;
    onCreateCard: (event: React.FormEvent<HTMLFormElement>, listId: string) => Promise<void>;
    showAddCardDialog: string | null;
    setShowAddCardDialog: (listId: string | null) => void;
    onUpdateCardOrder: (listId: string, newOrder: string[]) => void;
}

export default function BoardListColumn({
    list,
    cards,
    user,
    onDeleteList,
    onSelectCard,
    onCreateCard,
    showAddCardDialog,
    setShowAddCardDialog,
    onUpdateCardOrder,
}: BoardListColumnProps) {
    const [listCards, setListCards] = useState<BoardCard[]>(cards.filter(card => card.listId === list.id).sort((a, b) => (a.priority || 10) - (b.priority || 10)));

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setListCards((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newOrderedCards = arrayMove(items, oldIndex, newIndex);
                onUpdateCardOrder(list.id, newOrderedCards.map(card => card.id));
                return newOrderedCards;
            });
        }
    };

    return (
        <Card
            key={list.id}
            style={{
                minWidth: '250px',
                maxWidth: '300px',
                flex: '1',
            }}
        >
            <Flex direction='row' justify='between' align='center' mb='3'>
                <Heading as='h2' size='4'>
                    {list.title}
                </Heading>
                <Flex gap='2'>
                    <Dialog.Root open={showAddCardDialog === list.id} onOpenChange={(open) => setShowAddCardDialog(open ? list.id : null)}>
                        <Dialog.Trigger asChild>
                            <IconButton size='1' variant='soft' aria-label='Add card'>
                                <PlusIcon />
                            </IconButton>
                        </Dialog.Trigger>
                        <Dialog.Content style={{ maxWidth: 450 }}>
                            <Dialog.Title>Create New Card</Dialog.Title>
                            <CardForm
                                user={user}
                                onSubmit={(e) => onCreateCard(e, list.id)}
                            />
                        </Dialog.Content>
                    </Dialog.Root>
                    <IconButton
                        size='1'
                        variant='soft'
                        color='red'
                        onClick={() => onDeleteList(list.id)}
                    >
                        <TrashIcon />
                    </IconButton>
                </Flex>
            </Flex>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={listCards.map(card => card.id)} strategy={verticalListSortingStrategy}>
                    <Flex direction='column' gap='3'>
                        {listCards.map((card: BoardCard) => (
                            <BoardCardItem
                                key={card.id}
                                card={card}
                                onSelectCard={onSelectCard}
                            />
                        ))}
                    </Flex>
                </SortableContext>
            </DndContext>
        </Card>
    );
}
