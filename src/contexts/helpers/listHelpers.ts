import { BoardList } from '@/types/appState.type';

export function createListHelper(
    title: string,
    description: string,
    position: number
): BoardList {
    const timestamp = Date.now();
    return {
        id: `temp_${timestamp}`,
        title,
        description,
        position,
    };
}

export function updateListHelper(
    boardId: string,
    listId: string,
    data: Partial<BoardList>
) {
    return {
        type: 'update-list',
        payload: { boardId, listId, data },
        timestamp: Date.now(),
    };
}

export function deleteListHelper(boardId: string, listId: string) {
    return {
        type: 'delete-list',
        payload: { boardId, listId },
        timestamp: Date.now(),
    };
}
