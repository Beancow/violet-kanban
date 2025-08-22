'use client';
import { Board, BoardList, BoardCard, User } from '@/types/appState.type';
import { Flex, Box, Heading, Text, IconButton } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import BoardListColumn from './BoardListColumn';
import { useUiStore } from '@/store/uiStore';

interface BoardContentProps {
    board: Board;
    user: User | null;
    onSelectCard: (card: BoardCard) => void;
    onEditList: (list: BoardList) => void;
}

export default function BoardContent({
    board,
    onSelectCard,
    onEditList,
}: BoardContentProps) {
    return (
        <Box pt='8'>
            <Heading as='h1' size='6' align='center' mb='5'>
                {board.title}
            </Heading>
            <Flex direction='row' gap='4' justify='center' align='start'>
                {board && board.lists && board.lists.length > 0 ? (
                    board.lists.map((list: BoardList) => (
                        <BoardListColumn
                            key={list.id}
                            list={list}
                            cards={board.cards || []}
                            onSelectCard={onSelectCard}
                            onEditList={onEditList}
                        />
                    ))
                ) : (
                    <Text>No Lists found</Text>
                )}
                <IconButton
                    variant='solid'
                    size='3'
                    aria-label='Add new list'
                    onClick={() =>
                        useUiStore
                            .getState()
                            .open('create-list', { boardId: board.id })
                    }
                >
                    <PlusIcon />
                </IconButton>
            </Flex>
        </Box>
    );
}
