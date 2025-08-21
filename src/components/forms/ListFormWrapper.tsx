import { useCallback } from 'react';
import { BoardList, User } from '@/types/appState.type';
import { useVioletKanbanEnqueueListAction } from '@/store/useVioletKanbanHooks';
import { ListForm } from './ListForm';
import type { BoardListFormValues } from '@/schema/boardListSchema';

interface ListFormWrapperProps {
    list?: BoardList;
    boardId: string;
    user: User | null;
    onClose: () => void;
}

export function ListFormWrapper({
    list,
    boardId,
    user,
    onClose,
}: ListFormWrapperProps) {
    const enqueueListAction = useVioletKanbanEnqueueListAction();

    // OrganizationGate guarantees currentOrganizationId is always set
    const handleSubmit = useCallback(
        (data: BoardListFormValues) => {
            if (list?.id) {
                const updatePayload: Partial<BoardList> & { id: string } = {
                    id: list.id,
                    title: data.title,
                    description: data.description,
                    position: data.position,
                    boardId: data.boardId,
                    createdBy: data.createdBy,
                };
                enqueueListAction({
                    type: 'update-list',
                    payload: { data: updatePayload },
                    timestamp: Date.now(),
                });
            } else {
                const tempId = `temp-list-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`;
                const createData: Omit<BoardList, 'id'> = {
                    title: data.title,
                    description: data.description,
                    position: data.position ?? 0,
                    boardId: boardId,
                    organizationId: '',
                } as Omit<BoardList, 'id'>;
                enqueueListAction({
                    type: 'create-list',
                    payload: {
                        data: createData,
                        boardId,
                        tempId,
                    },
                    timestamp: Date.now(),
                });
            }
            onClose();
        },
        [list, boardId, enqueueListAction, onClose]
    );

    return <ListForm list={list} user={user} onSubmit={handleSubmit} />;
}
