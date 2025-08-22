import type { SyncAction } from '@/types/worker.type';
import type { BoardCreate, ListCreate, CardCreate } from '@/types/worker.type';
import type { Board, BoardList, BoardCard } from './appState.type';

// EnqueuePayload mirrors the SyncAction shapes but without auth fields (idToken)
export type EnqueuePayload =
    | {
          type: 'create-board';
          payload: { data: BoardCreate; tempId: string };
          timestamp: number;
      }
    | {
          type: 'update-board';
          payload: { data: Partial<Board> & { id: string } };
          timestamp: number;
      }
    | {
          type: 'create-list';
          payload: { data: ListCreate; boardId: string; tempId: string };
          timestamp: number;
      }
    | {
          type: 'update-list';
          payload: { data: Partial<BoardList> & { id: string } };
          timestamp: number;
      }
    | {
          type: 'create-card';
          payload: { data: CardCreate; boardId: string; listId: string; tempId: string };
          timestamp: number;
      }
    | {
          type: 'update-card';
          payload: { data: Partial<BoardCard> & { id: string } };
          timestamp: number;
      }
    | {
          type: 'delete-board' | 'delete-list' | 'delete-card' | 'soft-delete-card' | 'restore-card';
          payload: { id: string };
          timestamp: number;
      };

export type VioletKanbanAction = SyncAction | EnqueuePayload;

// Note: keep the store's original definition in `src/store/appStore.ts` for now
// but prefer importing this type from '@/types/violet-kanban-action' so we can
// remove `src/store` later without losing shared types.
