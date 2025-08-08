'use client';
import { BoardCard } from '@/types/appState.type';
import { Card, Flex, Text, IconButton, Tooltip } from '@radix-ui/themes';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BoardCardItemProps {
    card: BoardCard;
    onSelectCard: (card: BoardCard) => void;
}

export default function BoardCardItem({ card, onSelectCard }: BoardCardItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: card.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <Card ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Flex direction='row' justify='between' align='center'>
                <Text truncate>{card.title}</Text>
                <Tooltip content='Details'>
                    <IconButton
                        size='1'
                        variant='soft'
                        onClick={() => onSelectCard(card)}
                    >
                        <DotsHorizontalIcon />
                    </IconButton>
                </Tooltip>
            </Flex>
        </Card>
    );
}
