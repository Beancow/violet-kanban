'use client';
import { BoardCard } from '@/types/appState.type';
import { Card, Flex, Text } from '@radix-ui/themes';
import {
    DotsHorizontalIcon,
    TrashIcon,
    InfoCircledIcon,
} from '@radix-ui/react-icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DropdownMenu, IconButton } from '@radix-ui/themes';
import {
    useVioletKanbanEnqueueCardCreateOrUpdate,
    useVioletKanbanEnqueueCardDelete,
} from '@/store/useVioletKanbanHooks';
import { useCallback } from 'react';

interface BoardCardItemProps {
    card: BoardCard;
    boardId: string; // kept for API compatibility
    handleEditCard: (card: BoardCard) => void;
}

export function BoardCardItem({ card, handleEditCard }: BoardCardItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: card.id });
    const enqueueCardAction = useVioletKanbanEnqueueCardCreateOrUpdate();
    const enqueueCardDelete = useVioletKanbanEnqueueCardDelete();

    const handleDelete = useCallback(() => {
        enqueueCardDelete(card.id);
    }, [enqueueCardDelete, card.id]);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <Card ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Flex direction='row' justify='between' align='center'>
                <Text truncate>{card.title}</Text>
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        <IconButton size='1' variant='soft'>
                            <DotsHorizontalIcon />
                        </IconButton>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align='end'>
                        <DropdownMenu.Item onClick={() => handleEditCard(card)}>
                            <InfoCircledIcon /> Details
                        </DropdownMenu.Item>
                        <DropdownMenu.Item color='red' onClick={handleDelete}>
                            <TrashIcon /> Delete
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </Flex>
        </Card>
    );
}
