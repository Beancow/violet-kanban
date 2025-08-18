import { BoardCard } from '@/types/appState.type';

export function createCardHelper(
    listId: string,
    title: string,
    description: string,
    priority: number
): BoardCard {
    const timestamp = Date.now();
    return {
        id: `temp-${timestamp}`,
        title,
        description,
        priority,
        listId,
        completed: false,
        createdAt: new Date(timestamp).toISOString(),
        updatedAt: new Date(timestamp).toISOString(),
    };
}

export function updateCardHelper(
    boardId: string,
    cardId: string,
    data: Partial<BoardCard>
) {
    return {
        type: 'update-card',
        payload: { boardId, cardId, data },
        timestamp: Date.now(),
    };
}

export function deleteCardHelper(boardId: string, cardId: string) {
    return {
        type: 'delete-card',
        payload: { boardId, cardId },
        timestamp: Date.now(),
    };
}

export function softDeleteCardHelper(boardId: string, cardId: string) {
    return {
        type: 'soft-delete-card',
        payload: { boardId, cardId },
        timestamp: Date.now(),
    };
}

export function restoreCardHelper(boardId: string, cardId: string) {
    return {
        type: 'restore-card',
        payload: { boardId, cardId },
        timestamp: Date.now(),
    };
}

export function updateCardOrderHelper(
    boardId: string,
    listId: string,
    cardOrder: string[]
) {
    return {
        type: 'update-card-order',
        payload: { boardId, listId, cardOrder },
        timestamp: Date.now(),
    };
}
