import { useState, useCallback } from 'react';
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
} from '@radix-ui/react-icons';
import { useVioletKanbanRemoveCardAction } from '@/store/useVioletKanbanHooks';
import { useOrganizationStore } from '@/store/organizationStore';

import { CardForm } from '@/components/forms/CardForm';
import styles from './LooseCardsMenu.module.css';

interface LooseCardsMenuProps {
    cards: BoardCard[];
    boardId: string;
}

export function LooseCardsMenu({ cards, boardId }: LooseCardsMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
    const removeCardAction = useVioletKanbanRemoveCardAction();
    const currentOrganizationId = useOrganizationStore(
        (state) => state.currentOrganizationId
    );
    // OrganizationGate guarantees currentOrganizationId is always set
    // removeCardAction only needs cardId, orgId is not required
    const handleRestore = useCallback(
        (cardId: string) => {
            removeCardAction(cardId);
        },
        [removeCardAction]
    );

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
                        looseCards.map((card) =>
                            expandedCardId === card.id ? (
                                <div className={styles.looseCard} key={card.id}>
                                    <CardForm
                                        key={card.id}
                                        card={card}
                                        onSubmit={() => {}}
                                        onClose={() => setExpandedCardId(null)}
                                        hideTitle={true}
                                        small={true}
                                    />
                                </div>
                            ) : (
                                <Box key={card.id}>
                                    <Card
                                        className={styles.looseCard}
                                        onClick={() =>
                                            setExpandedCardId(
                                                expandedCardId === card.id
                                                    ? null
                                                    : card.id
                                            )
                                        }
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <Text truncate>{card.title}</Text>
                                    </Card>
                                </Box>
                            )
                        )
                    ) : (
                        <Text size='2' color='gray' key='no-loose-cards'>
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
                                        key={card.id}
                                        direction='row'
                                        justify='between'
                                        align='center'
                                    >
                                        <Text>{card.title}</Text>
                                        <Button
                                            size='1'
                                            variant='soft'
                                            color='green'
                                            onClick={() =>
                                                handleRestore(card.id)
                                            }
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
