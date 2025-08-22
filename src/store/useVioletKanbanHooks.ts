import { useBoardStore } from './boardStore';
import { useListStore } from './listStore';
import { useCardStore } from './cardStore';
import { useQueueStore } from './queueStore';

// Hook to get all boards, lists, cards
export function useVioletKanbanData() {
    const boards = useBoardStore((state) => state.boards);
    const lists = useListStore((state) => state.lists);
    const cards = useCardStore((state) => state.cards);
    return { boards, lists, cards };
}

// Hook to get orphaned cards
export function useVioletKanbanOrphanedCards() {
    return useCardStore((state) => state.orphanedCards ?? []);
}

// Hook to get action queues
export function useVioletKanbanQueues() {
    const boardActionQueue = useQueueStore((state) => state.boardActionQueue);
    const listActionQueue = useQueueStore((state) => state.listActionQueue);
    const cardActionQueue = useQueueStore((state) => state.cardActionQueue);
    return { boardActionQueue, listActionQueue, cardActionQueue };
}

// Example: Hook to add a board
export function useVioletKanbanAddBoard() {
    return useBoardStore((state) => state.addBoard);
}

// Example: Hook to add a list
export function useVioletKanbanAddList() {
    return useListStore((state) => state.addList);
}

// Example: Hook to add a card
export function useVioletKanbanAddCard() {
    return useCardStore((state) => state.addCard);
}

// NOTE: low-level enqueue helpers that accept raw VioletKanbanAction
// are intentionally not exported to discourage manual action construction.
// Convenience: enqueue a Board domain object for create or update
export function useVioletKanbanEnqueueBoardCreateOrUpdate() {
    return useQueueStore((state) => state.enqueueBoardCreateOrUpdate);
}

// Convenience: enqueue a List domain object for create or update
export function useVioletKanbanEnqueueListCreateOrUpdate() {
    return useQueueStore((state) => state.enqueueListCreateOrUpdate);
}
// Example: Hook to enqueue a card action
export function useVioletKanbanEnqueueCardCreateOrUpdate() {
    return useQueueStore((state) => state.enqueueCardCreateOrUpdate);
}

export function useVioletKanbanEnqueueCardMove() {
    return useQueueStore((state) => state.enqueueCardMove);
}

export function useVioletKanbanEnqueueCardDelete() {
    return useQueueStore((state) => state.enqueueCardDelete);
}

export function useVioletKanbanEnqueueListDelete() {
    return useQueueStore((state) => state.enqueueListDelete);
}

export function useVioletKanbanEnqueueBoardDelete() {
    return useQueueStore((state) => state.enqueueBoardDelete);
}

// Example: Hook to remove a processed board action
export function useVioletKanbanRemoveBoardAction() {
    return useQueueStore((state) => state.removeBoardAction);
}

// Example: Hook to remove a processed list action
export function useVioletKanbanRemoveListAction() {
    return useQueueStore((state) => state.removeListAction);
}

// Example: Hook to remove a processed card action
export function useVioletKanbanRemoveCardAction() {
    return useQueueStore((state) => state.removeCardAction);
}

// Example: Hook to handle board action success
export function useVioletKanbanHandleBoardActionSuccess() {
    return useQueueStore((state) => state.handleBoardActionSuccess);
}

// Example: Hook to handle list action success
export function useVioletKanbanHandleListActionSuccess() {
    return useQueueStore((state) => state.handleListActionSuccess);
}

// Example: Hook to handle card action success
export function useVioletKanbanHandleCardActionSuccess() {
    return useQueueStore((state) => state.handleCardActionSuccess);
}
