import { Draft, produce } from 'immer';

export type TempIdMapState = Record<string, string>;

type Action =
    | { type: 'SET_MAPPING'; tempId: string; realId: string }
    | { type: 'CLEAR_MAPPING'; tempId: string }
    | { type: 'CLEAR_ALL' };

export function reducer(state: TempIdMapState, action: Action): TempIdMapState {
    return produce(state, (draft: Draft<TempIdMapState>) => {
        switch (action.type) {
            case 'SET_MAPPING':
                draft[action.tempId] = action.realId;
                return;
            case 'CLEAR_MAPPING':
                delete draft[action.tempId];
                return;
            case 'CLEAR_ALL':
                Object.keys(draft).forEach((k) => delete draft[k]);
                return;
        }
    });
}

export default reducer;
