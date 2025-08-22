// Adapter interfaces extracted from src/store/factoryHelpers.ts
import type { Board, BoardList, BoardCard } from './appState.type';

export interface BoardStoreAdapter {
    addBoard?: (b: Board) => void;
    getState?: () => unknown;
}

export interface ListStoreAdapter {
    addList?: (l: BoardList) => void;
    getState?: () => unknown;
}

export interface CardStoreAdapter {
    addCard?: (c: BoardCard) => void;
    getState?: () => unknown;
}

// Minimal TempIdMap adapter shape used by the queue for tests
export type TempIdMapAdapter =
    | {
          setMapping: (t: string, r: string) => void;
          clearMapping: (t: string) => void;
      }
    | { getState: () => unknown };

export default {};
