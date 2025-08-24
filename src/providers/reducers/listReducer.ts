import { Draft, produce } from 'immer';
import type { BoardList } from '../../types/appState.type';
import type { ListStateShape } from '@/types/state-shapes';

export type ListState = ListStateShape;

export type ListAction =
    | { type: 'ADD_LIST'; list: BoardList }
    | { type: 'UPDATE_LIST'; list: Partial<BoardList> & { id: string } }
    | { type: 'REMOVE_LIST'; listId: string }
    | { type: 'SET_LISTS'; lists: BoardList[] };
export function reducer(state: ListState, action: ListAction): ListState {
    return produce(state, (draft: Draft<ListState>) => {
        switch (action.type) {
            case 'ADD_LIST':
                draft.lists.push(action.list);
                return;
            case 'UPDATE_LIST': {
                const idx = draft.lists.findIndex(
                    (l) => l.id === action.list.id
                );
                if (idx >= 0) {
                    draft.lists[idx] = {
                        ...draft.lists[idx],
                        ...action.list,
                    } as BoardList;
                }
                return;
            }
            case 'REMOVE_LIST':
                draft.lists = draft.lists.filter((l) => l.id !== action.listId);
                return;
            case 'SET_LISTS':
                draft.lists = action.lists;
                return;
        }
    });
}

export default reducer;
