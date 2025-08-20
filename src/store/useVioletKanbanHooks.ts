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

// Example: Hook to enqueue a board action
export function useVioletKanbanEnqueueBoardAction() {
    return useQueueStore((state) => state.enqueueBoardAction);
}

// Example: Hook to enqueue a list action
export function useVioletKanbanEnqueueListAction() {
    return useQueueStore((state) => state.enqueueListAction);
}

// Example: Hook to enqueue a card action
export function useVioletKanbanEnqueueCardAction() {
    return useQueueStore((state) => state.enqueueCardAction);
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
