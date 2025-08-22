import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BoardList, User } from '@/types/appState.type';
import { useVioletKanbanEnqueueListCreateOrUpdate } from '@/providers/useVioletKanbanHooks';
import { ListForm } from './ListForm';
import type { BoardListFormValues } from '@/schema/boardListSchema';
import { BoardListSchema } from '@/schema/boardListSchema';
import { useUi } from '@/providers/UiProvider';

interface ListFormWrapperProps {
    list?: BoardList;
    boardId: string;
    user: User | null;
    onClose?: () => void;
}

export function ListFormWrapper({
    list,
    boardId,
    user,
    onClose,
}: ListFormWrapperProps) {
    const enqueueListAction = useVioletKanbanEnqueueListCreateOrUpdate();
    const form = useForm<BoardListFormValues>({
        resolver: zodResolver(BoardListSchema),
        defaultValues: {
            id: list?.id ?? 'temp-list',
            title: list?.title ?? '',
            description: list?.description ?? '',
            position: list?.position ?? 0,
            boardId: boardId,
        },
    });

    const ui = useUi();

    // OrganizationGate guarantees currentOrganizationId is always set
    const handleSubmit = useCallback(
        (data: BoardListFormValues) => {
            const payload: BoardList = {
                ...(list ?? {}),
                title: data.title,
                description: data.description,
                position: data.position ?? 0,
                boardId: boardId,
                id: data.id ?? 'temp-list',
            } as BoardList;
            enqueueListAction(payload);
            if (onClose) onClose();
            else ui.close();
        },
        [list, boardId, enqueueListAction, onClose]
    );

    return (
        <ListForm list={list} user={user} form={form} onSubmit={handleSubmit} />
    );
}
