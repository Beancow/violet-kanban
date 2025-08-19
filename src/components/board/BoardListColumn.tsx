import {
    Card,
    Flex,
    Heading,
    IconButton,
    Dialog,
    DropdownMenu,
    Box,
    TextField,
} from '@radix-ui/themes';
import {
    PlusIcon,
    TrashIcon,
    DotsHorizontalIcon,
    Pencil1Icon,
    GearIcon,
} from '@radix-ui/react-icons';
import { BoardCardItem } from './BoardCardItem';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { CardForm } from '../forms/CardForm';
import { useState } from 'react';
import { BoardCard, BoardList, User } from '@/types/appState.type';

interface BoardListColumnProps {
    list: BoardList;
    cards: BoardCard[];
    user: User | null;
    onDeleteList: (listId: string) => void;
    onSelectCard: (card: BoardCard) => void;
    onCreateCard: (
        event: React.FormEvent<HTMLFormElement>,
        listId: string
    ) => Promise<void>;
    showAddCardDialog: string | null;
    setShowAddCardDialog: (listId: string | null) => void;
    onUpdateCardOrder: (listId: string, newOrder: string[]) => void;
    onUpdateListTitle: (listId: string, newTitle: string) => void;
    onEditList: (list: BoardList) => void;
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
    onUpdateListTitle,
    onEditList,
}: BoardListColumnProps) {
    const [listCards, setListCards] = useState<BoardCard[]>(
        cards
            .filter((card) => card.listId === list.id)
            .sort((a, b) => (a.priority || 10) - (b.priority || 10))
    );
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(list.title);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active && over && active.id !== over.id) {
            setListCards((items) => {
                const oldIndex = items.findIndex(
                    (item) => item.id === active.id
                );
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newOrderedCards = arrayMove(items, oldIndex, newIndex);
                onUpdateCardOrder(
                    list.id,
                    newOrderedCards.map((card) => card.id)
                );
                return newOrderedCards;
            });
        }
    };

    const handleUpdateListTitle = () => {
        if (editedTitle.trim() !== '' && editedTitle.trim() !== list.title) {
            onUpdateListTitle(list.id, editedTitle.trim());
        }
        setIsEditingTitle(false);
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
                <Box style={{ flex: 1 }} />
                {isEditingTitle ? (
                    <TextField.Root
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onBlur={handleUpdateListTitle}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleUpdateListTitle();
                            }
                        }}
                        autoFocus
                        style={{ flex: 1, textAlign: 'center' }}
                    />
                ) : (
                    <Heading
                        as='h2'
                        size='4'
                        style={{ flex: 1, textAlign: 'center' }}
                    >
                        {list.title}
                    </Heading>
                )}
                <Flex gap='2' style={{ flex: 1, justifyContent: 'flex-end' }}>
                    <Dialog.Root
                        open={showAddCardDialog === list.id}
                        onOpenChange={(open) =>
                            setShowAddCardDialog(open ? list.id : null)
                        }
                    >
                        <Dialog.Trigger>
                            <IconButton
                                size='1'
                                variant='soft'
                                aria-label='Add card'
                            >
                                <PlusIcon />
                            </IconButton>
                        </Dialog.Trigger>
                        <Dialog.Content style={{ maxWidth: 450 }}>
                            <Dialog.Title>Create New Card</Dialog.Title>
                            <CardForm
                                onSubmit={(e) => onCreateCard(e, list.id)}
                                onClose={() => {}}
                            />
                        </Dialog.Content>
                    </Dialog.Root>
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                            <IconButton size='1' variant='soft'>
                                <DotsHorizontalIcon />
                            </IconButton>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                            <DropdownMenu.Sub>
                                <DropdownMenu.SubTrigger>
                                    <Pencil1Icon />
                                    Edit
                                </DropdownMenu.SubTrigger>
                                <DropdownMenu.SubContent>
                                    <DropdownMenu.Item
                                        onClick={() => setIsEditingTitle(true)}
                                    >
                                        <Pencil1Icon />
                                        Edit name
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                        onClick={() => onEditList(list)}
                                    >
                                        <GearIcon />
                                        Edit details
                                    </DropdownMenu.Item>
                                </DropdownMenu.SubContent>
                            </DropdownMenu.Sub>
                            <DropdownMenu.Item
                                color='red'
                                onClick={() => onDeleteList(list.id)}
                            >
                                <TrashIcon />
                                Delete List
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </Flex>
            </Flex>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={listCards.map((card) => card.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <Flex direction='column' gap='3'>
                        {listCards.map((card: BoardCard) => (
                            <BoardCardItem
                                key={card.id}
                                card={card}
                                boardId={list.boardId}
                                handleEditCard={onSelectCard}
                            />
                        ))}
                    </Flex>
                </SortableContext>
            </DndContext>
        </Card>
    );
}
