import { useCallback } from 'react';
import { Board } from '@/types/appState.type';
import type { BoardFormValues } from '@/schema/boardSchema';
import { useVioletKanbanEnqueueBoardAction } from '@/store/useVioletKanbanHooks';
import { BoardForm } from './BoardForm';
import { useOrganizationStore } from '@/store/organizationStore';

interface BoardFormWrapperProps {
    board?: Board;
    onClose: () => void;
}

export function BoardFormWrapper({ board, onClose }: BoardFormWrapperProps) {
    const enqueueBoardAction = useVioletKanbanEnqueueBoardAction();
    const currentOrganizationId = useOrganizationStore(
        (s) => s.currentOrganizationId
    );

    // OrganizationGate guarantees currentOrganizationId is always set
    const handleSubmit = useCallback(
        (data: BoardFormValues) => {
            if (board?.id) {
                enqueueBoardAction({
                    type: 'update-board',
                    payload: { data: { ...board, ...data } },
                    timestamp: Date.now(),
                });
            } else {
                const tempId = `temp-board-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`;
                enqueueBoardAction({
                    type: 'create-board',
                    payload: {
                        data: {
                            ...data,
                            organizationId: currentOrganizationId || '',
                        },
                        tempId,
                    },
                    timestamp: Date.now(),
                });
            }
            onClose();
        },
        [board, enqueueBoardAction, onClose]
    );

    return <BoardForm board={board} onSubmit={handleSubmit} />;
}
