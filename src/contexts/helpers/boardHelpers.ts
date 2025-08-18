import { Board } from '@/types/appState.type';

export function createBoardHelper(
    title: string,
    description: string,
    organizationId: string
): Board {
    const timestamp = Date.now();
    return {
        id: `temp_${timestamp}`,
        organizationId,
        title,
        description,
        createdAt: new Date(timestamp).toISOString(),
        updatedAt: new Date(timestamp).toISOString(),
        lists: [],
        cards: [],
    };
}

export function updateBoardHelper(boardId: string, data: Partial<Board>) {
    return {
        type: 'update-board',
        payload: { boardId, data },
        timestamp: Date.now(),
    };
}

export function deleteBoardHelper(boardId: string) {
    return {
        type: 'delete-board',
        payload: { boardId },
        timestamp: Date.now(),
    };
}
