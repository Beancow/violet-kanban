import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useBoardStore } from './boardStore';
import { useListStore } from './listStore';
import { useCardStore } from './cardStore';
import { getActionItemId, squashQueueActions } from './helpers';
import type { VioletKanbanAction } from './appStore';

export interface QueueState {
    boardActionQueue: VioletKanbanAction[];
    listActionQueue: VioletKanbanAction[];
    cardActionQueue: VioletKanbanAction[];
    enqueueBoardAction: (action: VioletKanbanAction) => void;
    enqueueListAction: (action: VioletKanbanAction) => void;
    enqueueCardAction: (action: VioletKanbanAction) => void;
    removeBoardAction: (actionId: string) => void;
    removeListAction: (actionId: string) => void;
    removeCardAction: (actionId: string) => void;
    handleBoardActionSuccess: (actionId: string, newBoard: any) => void;
    handleListActionSuccess: (actionId: string, newList: any) => void;
    handleCardActionSuccess: (actionId: string, newCard: any) => void;
}

export const useQueueStore = create<QueueState>()(
    persist(
        (set, get) => ({
            boardActionQueue: [],
            listActionQueue: [],
            cardActionQueue: [],
            enqueueBoardAction: (action) =>
                set((state) => ({
                    boardActionQueue: squashQueueActions(
                        state.boardActionQueue,
                        action
                    ),
                })),
            enqueueListAction: (action) =>
                set((state) => ({
                    listActionQueue: squashQueueActions(
                        state.listActionQueue,
                        action
                    ),
                })),
            enqueueCardAction: (action) =>
                set((state) => ({
                    cardActionQueue: squashQueueActions(
                        state.cardActionQueue,
                        action
                    ),
                })),
            removeBoardAction: (actionId) =>
                set((state) => ({
                    boardActionQueue: state.boardActionQueue.filter(
                        (action) => getActionItemId(action) !== actionId
                    ),
                })),
            removeListAction: (actionId) =>
                set((state) => ({
                    listActionQueue: state.listActionQueue.filter(
                        (action) => getActionItemId(action) !== actionId
                    ),
                })),
            removeCardAction: (actionId) =>
                set((state) => ({
                    cardActionQueue: state.cardActionQueue.filter(
                        (action) => getActionItemId(action) !== actionId
                    ),
                })),
            handleBoardActionSuccess: (actionId, newBoard) => {
                useBoardStore.getState().updateBoard(newBoard);
                get().removeBoardAction(actionId);
            },
            handleListActionSuccess: (actionId, newList) => {
                useListStore.getState().updateList(newList);
                get().removeListAction(actionId);
            },
            handleCardActionSuccess: (actionId, newCard) => {
                useCardStore.getState().updateCard(newCard);
                get().removeCardAction(actionId);
            },
        }),
        { name: 'violet-kanban-queue-storage' }
    )
);
