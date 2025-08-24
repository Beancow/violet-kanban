import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Board } from '@/types/appState.type';
import type { BoardFormValues } from '@/schema/boardSchema';
import { useVioletKanbanEnqueueBoardCreateOrUpdate } from '@/providers/useVioletKanbanHooks';
import { BoardForm } from './BoardForm';
import { useOrganizationProvider } from '@/providers/OrganizationProvider';
import { BoardSchema } from '@/schema/boardSchema';
import { useUi } from '@/providers/UiProvider';
import { useCreatedBy } from '@/hooks/useCreatedBy';

interface BoardFormWrapperProps {
    board?: Board;
    onSubmit?: (data: BoardFormValues) => void | Promise<void>;
}

export function BoardFormWrapper({ board, onSubmit }: BoardFormWrapperProps) {
    const ui = useUi();
    const enqueueBoardAction = useVioletKanbanEnqueueBoardCreateOrUpdate();
    const currentOrganizationId =
        useOrganizationProvider().currentOrganizationId;

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
            if (onSubmit) onSubmit(data);
            ui.close();
        },
        [board, enqueueBoardAction, onSubmit, currentOrganizationId, ui]
    );

    return <BoardForm board={board} form={form} onSubmit={handleSubmit} />;
}
