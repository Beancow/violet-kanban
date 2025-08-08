'use client';
import { Board, BoardList, BoardCard, User } from '@/types/appState.type';
import { Flex, Box, Heading, Text, IconButton } from '@radix-ui/themes';
import Link from 'next/link';
import { PlusIcon } from '@radix-ui/react-icons';
import BoardListColumn from './BoardListColumn';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';

interface BoardContentProps {
    board: Board;
    user: User | null;
    onDeleteList: (listId: string) => void;
    onSelectCard: (card: BoardCard) => void;
    onCreateCard: (event: React.FormEvent<HTMLFormElement>, listId: string) => Promise<void>;
    showAddCardDialog: string | null;
    setShowAddCardDialog: (listId: string | null) => void;
    onDragEnd: (event: DragEndEvent) => void;
}

export default function BoardContent({
    board,
    user,
    onDeleteList,
    onSelectCard,
    onCreateCard,
    showAddCardDialog,
    setShowAddCardDialog,
    onDragEnd,
}: BoardContentProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    return (
        <Box pt='8'>
            <Heading as='h1' size='6' align='center' mb='5'>
                {board.title}
            </Heading>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
            >
                <Flex direction='row' gap='4' justify='center' align='start'>
                    {board && board.lists && board.lists.length > 0 ? (
                        board.lists.map((list: BoardList) => (
                            <BoardListColumn
                                key={list.id}
                                list={list}
                                cards={board.cards || []}
                                user={user}
                                onDeleteList={onDeleteList}
                                onSelectCard={onSelectCard}
                                onCreateCard={onCreateCard}
                                showAddCardDialog={showAddCardDialog}
                                setShowAddCardDialog={setShowAddCardDialog}
                            />
                        ))
                    ) : (
                        <Text>No Lists found</Text>
                    )}
                    <Link
                        href={`/board/${board.id}/list/create`}
                        style={{
                            textDecoration: 'none',
                        }}
                    >
                        <IconButton
                            variant='solid'
                            size='3'
                            aria-label='Add new list'
                        >
                            <PlusIcon />
                        </IconButton>
                    </Link>
                </Flex>
            </DndContext>
        </Box>
    );
}
