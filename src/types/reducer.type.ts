import type { SyncAction, WorkerMessage } from './worker.type';
import type { Board, BoardList, BoardCard } from './appState.type';

export interface DataState {
    isSyncing: boolean;
    actionQueue: SyncAction[];
    boardActionQueue?: SyncAction[];
    listActionQueue?: SyncAction[];
    cardActionQueue?: SyncAction[];
    boards: Board[];
    lists: BoardList[];
    cards: BoardCard[];
    lastMessage: WorkerMessage | null;
    tempIdMap: { [key: string]: string };
    timestamp: number;
}

export type ReducerAction =
    | { type: 'SET_STATE'; payload: Partial<DataState> }
    | { type: 'ADD_ACTION'; payload: SyncAction }
    | { type: 'START_SYNC' }
    | { type: 'ACTION_COMPLETE'; payload: { timestamp: number } }
    | {
          type: 'SET_LAST_MESSAGE';
          payload: { lastMessage: WorkerMessage | null };
      };
