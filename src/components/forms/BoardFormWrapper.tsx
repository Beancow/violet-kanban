import { useCallback } from 'react';
import { Board } from '@/types/appState.type';
import { useVioletKanbanEnqueueBoardAction } from '@/store/useVioletKanbanHooks';
import { BoardForm } from './BoardForm';

interface BoardFormWrapperProps {
    board?: Board;
    onClose: () => void;
}

export function BoardFormWrapper({ board, onClose }: BoardFormWrapperProps) {
    const enqueueBoardAction = useVioletKanbanEnqueueBoardAction();

    // OrganizationGate guarantees currentOrganizationId is always set
    const handleSubmit = useCallback(
        (data: any) => {
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
                        data,
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
