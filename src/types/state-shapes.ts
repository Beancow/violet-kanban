import type { Board, BoardList, BoardCard } from './appState.type';
import type { VioletKanbanAction, QueueItem } from './violet-kanban-action';

// Pure data shapes used by reducers (no API methods attached).
export type BoardStateShape = {
    boards: Board[];
};

export type ListStateShape = {
    lists: BoardList[];
};

export type CardStateShape = {
    cards: BoardCard[];
    orphanedCards?: BoardCard[];
};

export type QueueStateShape = {
    boardActionQueue: QueueItem[];
    listActionQueue: QueueItem[];
    cardActionQueue: QueueItem[];
};

export type TempIdMapStateShape = Record<string, string>;

export default {};
