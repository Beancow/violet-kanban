'use client';
import { useData } from '@/contexts/DataProvider';
import { LooseCardsMenu } from '@/components/menus/LooseCardsMenu';
import { BoardCard } from '@/types/appState.type';
import { useParams } from 'next/navigation';

export default function LooseCardsPanel({ cards }: { cards: BoardCard[] }) {
    const { boardId } = useParams();
    const { restoreCard } = useData();

    if (typeof boardId !== 'string') {
        throw new Error('boardId must be a string', {
            cause: new Error('Invalid boardId ' + boardId),
        });
    }

    const handleRestore = (cardId: string) => {
        if (typeof boardId === 'string' && typeof cardId === 'string') {
            restoreCard(boardId, cardId);
        }
    };

    const handleSelectCard = (card: BoardCard) => {
        // Implement details modal or reducer action here
        // For now, just log the card
        console.log('Selected card for details:', card);
    };

    return <LooseCardsMenu cards={cards} boardId={boardId} />;
}
