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
import { CardForm } from '@/app/components/forms/CardForm';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

interface BoardListColumnProps {
    list: BoardList;
    cards: BoardCard[];
    user: User | null;
    onDeleteList: (listId: string) => void;
    onSelectCard: (card: BoardCard) => void;
    onCreateCard: (event: React.FormEvent<HTMLFormElement>, listId: string) => Promise<void>;
    showAddCardDialog: string | null;
    setShowAddCardDialog: (listId: string | null) => void;
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
}: BoardListColumnProps) {
    const { setNodeRef } = useDroppable({ id: list.id });

    const displayCards = cards
        ?.filter((card) => !card.isDeleted && card.listId === list.id);

    return (
        <Card
            ref={setNodeRef}
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
            <SortableContext items={displayCards.map(card => card.id)} strategy={verticalListSortingStrategy}>
                <Flex direction='column' gap='3'>
                    {displayCards.map((card: BoardCard) => (
                        <BoardCardItem
                            key={card.id}
                            card={card}
                            onSelectCard={onSelectCard}
                        />
                    ))}
                </Flex>
            </SortableContext>
        </Card>
    );
}
