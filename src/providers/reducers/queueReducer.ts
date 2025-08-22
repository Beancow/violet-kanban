import { Draft, produce } from 'immer';
import type { VioletKanbanAction } from '../../store/appStore';

export type QueueState = {
    boardActionQueue: VioletKanbanAction[];
    listActionQueue: VioletKanbanAction[];
    cardActionQueue: VioletKanbanAction[];
};

type Action =
    | { type: 'ENQUEUE_BOARD'; action: VioletKanbanAction }
    | { type: 'ENQUEUE_LIST'; action: VioletKanbanAction }
    | { type: 'ENQUEUE_CARD'; action: VioletKanbanAction }
    | { type: 'REMOVE_BOARD_BY_ID'; itemId: string }
    | { type: 'REMOVE_LIST_BY_ID'; itemId: string }
    | { type: 'REMOVE_CARD_BY_ID'; itemId: string }
    | { type: 'SET_STATE'; state: QueueState };

function getActionItemId(action: VioletKanbanAction): string | undefined {
    try {
        const payload = (action as any).payload as any;
        if (payload) {
            if (payload.data && typeof payload.data === 'object') {
                if (typeof payload.data.id === 'string') return payload.data.id;
                if (typeof payload.data.tempId === 'string')
                    return payload.data.tempId;
            }
            if (typeof payload.id === 'string') return payload.id;
            if (typeof payload.tempId === 'string') return payload.tempId;
        }
    } catch (e) {
        // ignore
    }
    return undefined;
}

function squashQueueActions(
    queue: VioletKanbanAction[],
    newAction: VioletKanbanAction
) {
    const newId = getActionItemId(newAction);
    const newType = newAction.type;
    const filteredQueue = queue.filter((action) => {
        const id = getActionItemId(action);
        return !(id && newId && id === newId && action.type === newType);
    });
    return [...filteredQueue, newAction];
}

export function reducer(state: QueueState, action: Action): QueueState {
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
