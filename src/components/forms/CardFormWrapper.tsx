import { useCallback } from 'react';
import { BoardCard } from '@/types/appState.type';
import { useVioletKanbanEnqueueCardCreateOrUpdate } from '@/providers/useVioletKanbanHooks';
import { CardForm } from './CardForm';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BoardCardFormValues, boardCardSchema } from '@/schema/boardCardSchema';
import { useUi } from '@/providers/UiProvider';
import { useOrganizationStore } from '@/store/organizationStore';
import { useParams } from 'next/navigation';
import { useCreatedBy } from '@/hooks/useCreatedBy';

interface CardFormWrapperProps {
    card?: BoardCard;
    listId: string;
}

export function CardFormWrapper({ card, listId }: CardFormWrapperProps) {
    const params = useParams();
    const { boardId } = params as { boardId: string | undefined };
    const currentOrganizationId = useOrganizationStore(
        (state) => state.currentOrganizationId
    );
    const enqueueCardAction = useVioletKanbanEnqueueCardCreateOrUpdate();
    const ui = useUi();

    const createdBy = useCreatedBy(card);

    const form = useForm<BoardCardFormValues>({
        resolver: zodResolver(boardCardSchema),
        defaultValues: {
            id: card?.id ?? 'temp-card',
            title: card?.title || '',
            description: card?.description || '',
            priority: card?.priority ?? 0,
            listId: card?.listId ?? listId,
            boardId: card?.boardId ?? boardId?.toString(),
            organizationId: card?.organizationId ?? currentOrganizationId ?? '',
            completed: card?.completed,
            isDeleted: card?.isDeleted,
            isArchived: card?.isArchived,
            createdAt: card?.createdAt ?? '',
            updatedAt: card?.updatedAt ?? '',
            createdBy,
        },
    });

    const handleSubmit = useCallback(
        (data: BoardCardFormValues) => {
            const cardData: BoardCard = {
                ...data,
                id: data.id ?? 'temp-card',
                createdBy,
            };
            enqueueCardAction(cardData);
            ui.close();
        },
        [enqueueCardAction, close, createdBy]
    );

    return <CardForm card={card} form={form} onSubmit={handleSubmit} />;
}
