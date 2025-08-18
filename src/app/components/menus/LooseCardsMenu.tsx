import { useState } from 'react';
import {
    Box,
    Card,
    Text,
    Flex,
    Tooltip,
    IconButton,
    Button,
} from '@radix-ui/themes';
import { BoardCard } from '@/types/appState.type';
import {
    ChevronRightIcon,
    Cross1Icon,
    ReloadIcon,
    TrashIcon,
} from '@radix-ui/react-icons';
import { useData } from '@/contexts/DataProvider';

import BoardCardItem from '@/app/components/board/BoardCardItem';

interface LooseCardsMenuProps {
    cards: BoardCard[];
    onRestore: (cardId: string) => void;
    onSelectCard: (card: BoardCard) => void;
    boardId: string;
}

export function LooseCardsMenu({
    cards,
    onRestore,
    onSelectCard,
    boardId,
}: LooseCardsMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { softDeleteCard } = useData();

    const looseCards = cards.filter((card) => !card.isDeleted);
    const deletedCards = cards.filter((card) => card.isDeleted);

    return (
        <Box
            style={{
                position: 'fixed',
                left: isOpen ? 0 : '-250px',
                top: 0,
                height: '100vh',
                width: '250px',
                backgroundColor: 'var(--gray-2)',
                transition: 'left 0.3s ease-in-out',
                zIndex: 1000,
            }}
        >
            <Tooltip
                content={isOpen ? 'Close menu' : 'Show loose/deleted cards'}
            >
                <IconButton
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        position: 'absolute',
                        right: '-50px',
                        top: '50px',
                    }}
                >
                    {isOpen ? <Cross1Icon /> : <ChevronRightIcon />}
                </IconButton>
            </Tooltip>
            <Box p='4'>
                <Text size='4' weight='bold' mb='4'>
                    Loose Cards
                </Text>
                <Flex direction='column' gap='3' mb='4'>
                    {looseCards.length > 0 ? (
                        looseCards.map((card) => (
                            <Flex key={card.id} align='center' gap='2'>
                                <Box style={{ flexGrow: 1 }}>
                                    <BoardCardItem
                                        card={card}
                                        onSelectCard={onSelectCard}
                                    />
                                </Box>
                                <IconButton
                                    size='1'
                                    color='red'
                                    variant='soft'
                                    onClick={() =>
                                        softDeleteCard(boardId, card.id)
                                    }
                                >
                                    <TrashIcon />
                                </IconButton>
                            </Flex>
                        ))
                    ) : (
                        <Text size='2' color='gray'>
                            No loose cards
                        </Text>
                    )}
                </Flex>

                {deletedCards.length > 0 && (
                    <>
                        <Text size='4' weight='bold' mb='4'>
                            Deleted Cards
                        </Text>
                        <Flex direction='column' gap='3'>
                            {deletedCards.map((card) => (
                                <Card key={card.id}>
                                    <Flex
                                        direction='row'
                                        justify='between'
                                        align='center'
                                    >
                                        <Text>{card.title}</Text>
                                        <Button
                                            size='1'
                                            variant='soft'
                                            color='green'
                                            onClick={() => onRestore(card.id)}
                                        >
                                            <ReloadIcon />
                                        </Button>
                                    </Flex>
                                </Card>
                            ))}
                        </Flex>
                    </>
                )}
            </Box>
        </Box>
    );
}
