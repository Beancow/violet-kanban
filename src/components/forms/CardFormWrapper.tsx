import { useCallback } from 'react';
import { BoardCard } from '@/types/appState.type';
import { useVioletKanbanEnqueueCardAction } from '@/store/useVioletKanbanHooks';
import { CardForm } from './CardForm';
import type { BoardCardFormValues } from '@/schema/boardCardSchema';
import type { CardCreate } from '@/types/worker.type';

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
        (data: BoardCardFormValues) => {
            const toStringOrUndefined = (v?: string | Date) =>
                v == null
                    ? undefined
                    : typeof v === 'string'
                    ? v
                    : v.toString();

            if (card?.id) {
                const updatePayload: Partial<
                    import('@/types/appState.type').BoardCard
                > & {
                    id: string;
                } = {
                    id: card.id,
                    title: data.title,
                    description: data.description,
                    priority: data.priority,
                    listId: data.listId ?? '',
                    boardId: data.boardId,
                    organizationId: data.organizationId,
                    completed: data.completed,
                    isDeleted: data.isDeleted,
                    isArchived: data.isArchived,
                    createdAt: toStringOrUndefined(data.createdAt),
                    updatedAt: toStringOrUndefined(data.updatedAt),
                    createdBy: data.createdBy,
                };
                enqueueCardAction({
                    type: 'update-card',
                    payload: { data: updatePayload },
                    timestamp: Date.now(),
                });
            } else {
                const tempId = `temp-card-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`;
                const createData: CardCreate = {
                    title: data.title,
                    description: data.description,
                    priority: data.priority,
                    listId: data.listId ?? '',
                    boardId: data.boardId,
                    organizationId: data.organizationId,
                    completed: data.completed,
                    isDeleted: data.isDeleted,
                    isArchived: data.isArchived,
                    createdAt: toStringOrUndefined(data.createdAt),
                    updatedAt: toStringOrUndefined(data.updatedAt),
                    createdBy: data.createdBy,
                };
                enqueueCardAction({
                    type: 'create-card',
                    payload: {
                        data: createData,
                        boardId: data.boardId,
                        listId: data.listId ?? '',
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
