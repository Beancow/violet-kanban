import { Draft, produce } from 'immer';
import type { QueueItem } from '@/types/violet-kanban-action';
import type { QueueStateShape } from '@/types/state-shapes';
import { getActionItemId, squashQueueActions } from '@/providers/helpers';

export type QueueState = QueueStateShape;

export type QueueAction =
    | { type: 'ENQUEUE_BOARD'; action: QueueItem }
    | { type: 'ENQUEUE_LIST'; action: QueueItem }
    | { type: 'ENQUEUE_CARD'; action: QueueItem }
    | { type: 'REMOVE_BOARD_BY_ID'; itemId: string }
    | { type: 'REMOVE_LIST_BY_ID'; itemId: string }
    | { type: 'REMOVE_CARD_BY_ID'; itemId: string }
    | { type: 'REMOVE_ORG_BY_ID'; itemId: string }
    | { type: 'SET_STATE'; state: QueueState };

export function reducer(state: QueueState, action: QueueAction): QueueState {
    return produce(state, (draft: Draft<QueueState>) => {
        switch (action.type) {
            case 'ENQUEUE_BOARD':
                draft.boardActionQueue = squashQueueActions(
                    draft.boardActionQueue,
                    action.action
                );
                return;
            case 'ENQUEUE_LIST':
                draft.listActionQueue = squashQueueActions(
                    draft.listActionQueue,
                    action.action
                );
                return;
            case 'ENQUEUE_CARD':
                draft.cardActionQueue = squashQueueActions(
                    draft.cardActionQueue,
                    action.action
                );
                return;

            case 'REMOVE_BOARD_BY_ID':
                draft.boardActionQueue = draft.boardActionQueue.filter(
                    (a) => getActionItemId(a) !== action.itemId
                );
                return;
            case 'REMOVE_LIST_BY_ID':
                draft.listActionQueue = draft.listActionQueue.filter(
                    (a) => getActionItemId(a) !== action.itemId
                );
                return;
            case 'REMOVE_CARD_BY_ID':
                draft.cardActionQueue = draft.cardActionQueue.filter(
                    (a) => getActionItemId(a) !== action.itemId
                );
                return;

            case 'SET_STATE':
                return action.state;
        }
    });
}

export default reducer;
