import { useCallback } from 'react';
import { Board } from '@/types/appState.type';
import { useData } from '@/contexts/DataProvider';
import { BoardForm } from './BoardForm';

interface BoardFormWrapperProps {
    board?: Board;
    onClose: () => void;
}

export function BoardFormWrapper({ board, onClose }: BoardFormWrapperProps) {
    const { queueCreateBoard, queueUpdateBoard } = useData();

    const handleSubmit = useCallback(
        (data: any) => {
            if (board?.id) {
                queueUpdateBoard(board.id, data);
            } else {
                queueCreateBoard(data);
            }
            onClose();
        },
        [board, queueCreateBoard, queueUpdateBoard, onClose]
    );

    return <BoardForm board={board} onSubmit={handleSubmit} />;
}
