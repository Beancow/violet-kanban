import { useCallback } from 'react';
import { BoardList, User } from '@/types/appState.type';
import { useData } from '@/contexts/DataProvider';
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
    const { queueCreateList, queueUpdateList } = useData();

    const handleSubmit = useCallback(
        (data: any) => {
            if (list?.id) {
                queueUpdateList(boardId, list.id, data);
            } else {
                queueCreateList(boardId, data);
            }
            onClose();
        },
        [list, boardId, queueCreateList, queueUpdateList, onClose]
    );

    return <ListForm list={list} user={user} onSubmit={handleSubmit} />;
}
