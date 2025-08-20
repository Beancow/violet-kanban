import { useCallback } from 'react';
import { BoardCard } from '@/types/appState.type';
import { useVioletKanbanEnqueueCardAction } from '@/store/useVioletKanbanHooks';
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
    const enqueueCardAction = useVioletKanbanEnqueueCardAction();

    // OrganizationGate guarantees currentOrganizationId is always set
    const handleSubmit = useCallback(
        (data: any) => {
            if (card?.id) {
                enqueueCardAction({
                    type: 'update-card',
                    payload: { data },
                    timestamp: Date.now(),
                });
            } else {
                const tempId = `temp-card-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`;
                enqueueCardAction({
                    type: 'create-card',
                    payload: {
                        data,
                        boardId: data.boardId,
                        listId: data.listId,
                        tempId,
                    },
                    timestamp: Date.now(),
                });
            }
            onClose();
        },
        [card, enqueueCardAction, onClose]
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
