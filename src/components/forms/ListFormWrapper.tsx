import { useCallback } from 'react';
import { BoardList, User } from '@/types/appState.type';
import { useVioletKanbanEnqueueListAction } from '@/store/useVioletKanbanHooks';
import { ListForm } from './ListForm';

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
        (data: any) => {
            if (list?.id) {
                enqueueListAction({
                    type: 'update-list',
                    payload: { data },
                    timestamp: Date.now(),
                });
            } else {
                const tempId = `temp-list-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`;
                enqueueListAction({
                    type: 'create-list',
                    payload: {
                        data,
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
