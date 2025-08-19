import { useCallback } from 'react';
import { BoardCard } from '@/types/appState.type';
import { useData } from '@/contexts/DataProvider';
import { CardForm } from './CardForm';

interface CardFormWrapperProps {
    card?: BoardCard;
    onClose: () => void;
    hideTitle?: boolean;
    small?: boolean;
}

export function CardFormWrapper({
    card,
    onClose,
    hideTitle,
    small,
}: CardFormWrapperProps) {
    const { queueUpdateCard, queueCreateCard } = useData();

    const handleSubmit = useCallback(
        (data: any) => {
            if (card?.id) {
                queueUpdateCard(card.boardId, card.id, data);
            } else {
                queueCreateCard(data.boardId, data);
            }
            onClose();
        },
        [card, queueUpdateCard, queueCreateCard, onClose]
    );

    return (
        <CardForm
            card={card}
            onSubmit={handleSubmit}
            onClose={onClose}
            hideTitle={hideTitle}
            small={small}
        />
    );
}
