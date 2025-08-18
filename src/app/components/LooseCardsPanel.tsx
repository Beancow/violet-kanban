'use client';
import { useData } from '@/contexts/DataProvider';
import { LooseCardsMenu } from '@/app/components/menus/LooseCardsMenu';
import { BoardCard } from '@/types/appState.type';
import { useParams } from 'next/navigation';

export default function LooseCardsPanel({ cards }: { cards: BoardCard[] }) {
    const { boardId } = useParams();
    const { restoreCard } = useData();
    const onSelectCard = () => {};

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

    return (
        <LooseCardsMenu
            cards={cards}
            onRestore={handleRestore}
            onSelectCard={onSelectCard}
            boardId={boardId}
        />
    );
}
