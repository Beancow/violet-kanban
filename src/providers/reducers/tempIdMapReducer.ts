import { Draft, produce } from 'immer';
import type { TempIdMapStateShape } from '@/types/state-shapes';

export type TempIdMapState = TempIdMapStateShape;

export type TempIdMapAction =
    | { type: 'SET_MAPPING'; tempId: string; realId: string }
    | { type: 'CLEAR_MAPPING'; tempId: string }
    | { type: 'CLEAR_ALL' };
export function reducer(
    state: TempIdMapState,
    action: TempIdMapAction
): TempIdMapState {
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
