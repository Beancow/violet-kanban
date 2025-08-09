'use client';
import { Board, BoardList, BoardCard, User } from '@/types/appState.type';
import { Flex, Box, Heading, Text, IconButton, Dialog } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import BoardListColumn from './BoardListColumn';
import { ListForm } from '../forms/ListForm';


interface BoardContentProps {
    board: Board;
    user: User | null;
    onDeleteList: (listId: string) => void;
    onSelectCard: (card: BoardCard) => void;
    onCreateCard: (event: React.FormEvent<HTMLFormElement>, listId: string) => Promise<void>;
    onCreateList: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
    showAddCardDialog: string | null;
    setShowAddCardDialog: (listId: string | null) => void;
    showAddListDialog: boolean;
    setShowAddListDialog: (show: boolean) => void;
    onUpdateCardOrder: (listId: string, newOrder: string[]) => void;
}

export default function BoardContent({
    board,
    user,
    onDeleteList,
    onSelectCard,
    onCreateCard,
    onCreateList,
    showAddCardDialog,
    setShowAddCardDialog,
    showAddListDialog,
    setShowAddListDialog,
    onUpdateCardOrder,
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
                                user={user}
                                onDeleteList={onDeleteList}
                                onSelectCard={onSelectCard}
                                onCreateCard={onCreateCard}
                                showAddCardDialog={showAddCardDialog}
                                setShowAddCardDialog={setShowAddCardDialog}
                                onUpdateCardOrder={onUpdateCardOrder}
                            />
                        ))
                    ) : (
                        <Text>No Lists found</Text>
                    )}
                    <Dialog.Root open={showAddListDialog} onOpenChange={setShowAddListDialog}>
                        <Dialog.Trigger>
                            <IconButton
                                variant='solid'
                                size='3'
                                aria-label='Add new list'
                            >
                                <PlusIcon />
                            </IconButton>
                        </Dialog.Trigger>
                        <Dialog.Content style={{ maxWidth: 450, '--dialog-overlay-background': 'transparent' }}>
                            <Dialog.Title>Create New List</Dialog.Title>
                            <ListForm user={user} onSubmit={onCreateList} />
                        </Dialog.Content>
                    </Dialog.Root>
                </Flex>
        </Box>
    );
}
