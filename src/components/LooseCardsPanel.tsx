'use client';
import { LooseCardsMenu } from '@/components/menus/LooseCardsMenu';
import { BoardCard } from '@/types';
import { useParams } from 'next/navigation';

export default function LooseCardsPanel({ cards }: { cards: BoardCard[] }) {
    const { boardId } = useParams();

    if (typeof boardId !== 'string') {
        throw new Error('boardId must be a string', {
            cause: new Error('Invalid boardId ' + boardId),
        });
    }

    return <LooseCardsMenu cards={cards} boardId={boardId} />;
}
