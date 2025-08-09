import { Action } from './sync.type';
import { Board, BoardList, BoardCard } from './appState.type';
import { WorkerMessage } from './worker.type';

export interface DataState {
    isSyncing: boolean;
    isEditing: boolean;
    actionQueue: Action[];
    boards: Board[];
    lists: BoardList[];
    cards: BoardCard[];
    lastMessage: WorkerMessage | null;
    tempIdMap: { [key: string]: string };
    timestamp: number;
}

export type ReducerAction =
    | { type: 'SET_STATE'; payload: Partial<DataState> }
    | { type: 'ADD_ACTION'; payload: Action }
    | { type: 'START_SYNC' }
    | { type: 'ACTION_COMPLETE'; payload: { timestamp: number } }
    | { type: 'SET_LAST_MESSAGE'; payload: { lastMessage: WorkerMessage | null } };
