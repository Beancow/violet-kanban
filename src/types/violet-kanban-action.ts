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
          payload: {
              data: CardCreate;
              boardId: string;
              listId: string;
              tempId: string;
          };
          timestamp: number;
      }
    | {
          type: 'update-card';
          payload: { data: Partial<BoardCard> & { id: string } };
          timestamp: number;
      }
    | {
          type:
              | 'delete-board'
              | 'delete-list'
              | 'delete-card'
              | 'soft-delete-card'
              | 'restore-card';
          payload: { id: string };
          timestamp: number;
      }
    // Reconcile actions produced by the worker to reconcile tempIds with real IDs
    | {
          type: 'reconcile-board';
          payload: { tempId: string; board: Board };
          timestamp?: number;
      }
    | {
          type: 'reconcile-list';
          payload: { tempId: string; list: BoardList };
          timestamp?: number;
      }
    | {
          type: 'reconcile-card';
          payload: { tempId: string; card: BoardCard };
          timestamp?: number;
      }
    | {
          type: 'fetch-organizations';
          payload: { userId: string; timestamp: number };
          timestamp: number;
      };

export type VioletKanbanAction = SyncAction | EnqueuePayload;

// Note: original runtime definitions were in legacy files; prefer importing
// this type from '@/types/violet-kanban-action' so the legacy implementation
// can be removed once consumers are migrated.

// Queue wrapper: keep domain actions pure and store queue bookkeeping here.
export type QueueMeta = {
    enqueuedAt: number; // epoch ms
    attempts?: number;
    nextAttemptAt?: number | null;
    ttlMs?: number | null;
    lastError?: string | null;
};

export type QueueItem = {
    id: string; // deterministic dedupe key, computed at enqueue time
    action: VioletKanbanAction;
    meta: QueueMeta;
};
