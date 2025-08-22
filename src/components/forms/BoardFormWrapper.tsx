import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Board } from '@/types/appState.type';
import type { BoardFormValues } from '@/schema/boardSchema';
import { useVioletKanbanEnqueueBoardCreateOrUpdate } from '@/store/useVioletKanbanHooks';
import { BoardForm } from './BoardForm';
import { useOrganizationStore } from '@/store/organizationStore';
import { BoardSchema } from '@/schema/boardSchema';
import { useUiStore } from '@/store/uiStore';
import { useCreatedBy } from '@/hooks/useCreatedBy';

interface BoardFormWrapperProps {
    board?: Board;
}

export function BoardFormWrapper({ board }: BoardFormWrapperProps) {
    const close = useUiStore((state) => state.close);
    const enqueueBoardAction = useVioletKanbanEnqueueBoardCreateOrUpdate();
    const currentOrganizationId = useOrganizationStore(
        (s) => s.currentOrganizationId
    );

    const createdBy = useCreatedBy(board);

    // OrganizationGate guarantees currentOrganizationId is always set
    const form = useForm<BoardFormValues>({
        resolver: zodResolver(BoardSchema),
        defaultValues: {
            title: board?.title ?? '',
            description: board?.description ?? '',
            organizationId:
                board?.organizationId ?? currentOrganizationId ?? '',
            createdBy,
        },
    });

    // OrganizationGate guarantees currentOrganizationId is always set
    const handleSubmit = useCallback(
        (data: BoardFormValues) => {
            const boardPayload: Board = {
                ...data,
                organizationId:
                    data?.organizationId ?? currentOrganizationId ?? '',
            } as Board;
            enqueueBoardAction(boardPayload);
            close();
        },
        [board, enqueueBoardAction, close, currentOrganizationId]
    );

    return <BoardForm board={board} form={form} onSubmit={handleSubmit} />;
}
