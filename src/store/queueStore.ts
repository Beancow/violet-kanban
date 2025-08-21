import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// No direct store calls for reconciliation
import { getActionItemId, squashQueueActions } from './helpers';
import { useTempIdMapStore } from './tempIdMapStore';
import { useBoardStore } from './boardStore';
import { useListStore } from './listStore';
import { useCardStore } from './cardStore';
import type { VioletKanbanAction } from './appStore';
import { persistClientStorage } from './persistClientStorage';

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
        (set, _get) => ({
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
            handleBoardActionSuccess: (tempId, newBoard) => {
                useTempIdMapStore.getState().setMapping(tempId, newBoard.id);
                // Move the board to the real store
                useBoardStore().addBoard(newBoard);
                // Remove the item from the queue after move
                set((state) => ({
                    boardActionQueue: state.boardActionQueue.filter(
                        (action) => getActionItemId(action) !== tempId
                    ),
                }));
                useTempIdMapStore.getState().clearMapping(tempId);
            },
            handleListActionSuccess: (tempId, newList) => {
                useTempIdMapStore.getState().setMapping(tempId, newList.id);
                // Move the list to the real store
                useListStore().addList(newList);
                // Remove the item from the queue after move
                set((state) => ({
                    listActionQueue: state.listActionQueue.filter(
                        (action) => getActionItemId(action) !== tempId
                    ),
                }));
                useTempIdMapStore.getState().clearMapping(tempId);
            },
            handleCardActionSuccess: (tempId, newCard) => {
                useTempIdMapStore.getState().setMapping(tempId, newCard.id);
                // Move the card to the real store
                useCardStore().addCard(newCard);
                // Remove the item from the queue after move
                set((state) => ({
                    cardActionQueue: state.cardActionQueue.filter(
                        (action) => getActionItemId(action) !== tempId
                    ),
                }));
                useTempIdMapStore.getState().clearMapping(tempId);
            },
        }),
        { name: 'violet-kanban-queue-storage', storage: persistClientStorage }
    )
);
