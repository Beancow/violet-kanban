import { useUi } from '@/providers/UiProvider';
import {
    Card,
    Flex,
    Heading,
    IconButton,
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
// CardForm removed; list and card creation use wrappers and enqueue actions
import {
    useVioletKanbanEnqueueCardCreateOrUpdate,
    useVioletKanbanEnqueueListCreateOrUpdate,
    useVioletKanbanEnqueueCardMove,
    useVioletKanbanEnqueueListDelete,
} from '@/providers/useVioletKanbanHooks';
import { useState } from 'react';
import { BoardCard, BoardList } from '@/types/appState.type';

interface BoardListColumnProps {
    list: BoardList;
    cards: BoardCard[];
    onSelectCard: (card: BoardCard) => void;
    onEditList: (list: BoardList) => void;
}

export default function BoardListColumn({
    list,
    cards,
    onSelectCard,
    onEditList,
}: BoardListColumnProps) {
    const enqueueCardAction = useVioletKanbanEnqueueCardCreateOrUpdate();
    const enqueueListAction = useVioletKanbanEnqueueListCreateOrUpdate();
    const enqueueCardMove = useVioletKanbanEnqueueCardMove();
    const enqueueListDelete = useVioletKanbanEnqueueListDelete();
    const ui = useUi();
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
                // enqueue a move-card action for the moved card
                enqueueCardMove({
                    id: String(active.id),
                    newIndex,
                    listId: list.id,
                    boardId: list.boardId,
                });
                return newOrderedCards;
            });
        }
    };

    const handleUpdateListTitle = () => {
        if (editedTitle.trim() !== '' && editedTitle.trim() !== list.title) {
            enqueueListAction({
                ...list,
                title: editedTitle.trim(),
            } as BoardList);
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
                    <IconButton
                        size='1'
                        variant='soft'
                        aria-label='Add card'
                        onClick={() =>
                            ui.open('create-card', { listId: list.id })
                        }
                    >
                        <PlusIcon />
                    </IconButton>
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
                                onClick={() => enqueueListDelete(list.id)}
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
