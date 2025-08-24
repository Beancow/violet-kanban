import type {
    Board,
    BoardList,
    BoardCard,
    Organization,
} from './appState.type';

// Helper create payload shapes
export type BoardCreate = Omit<Board, 'id' | 'lists' | 'cards'>;
export type ListCreate = Omit<BoardList, 'id'>;
export type CardCreate = Omit<BoardCard, 'id'>;
export type SyncAction =
    | {
          type: 'create-board';
          payload: { data: BoardCreate; tempId: string; idToken?: string };
          timestamp: number;
      }
    | {
          type: 'update-board';
          payload: { data: Partial<Board> & { id: string }; idToken?: string };
          timestamp: number;
      }
    | {
          type: 'create-list';
          payload: {
              data: ListCreate;
              boardId: string;
              tempId: string;
              idToken?: string;
          };
          timestamp: number;
      }
    | {
          type: 'update-list';
          payload: {
              data: Partial<BoardList> & { id: string };
              idToken?: string;
          };
          timestamp: number;
      }
    | {
          type: 'create-card';
          payload: {
              data: CardCreate;
              boardId: string;
              listId: string;
              tempId: string;
              idToken?: string;
          };
          timestamp: number;
      }
    | {
          type: 'update-card';
          payload: {
              data: Partial<BoardCard> & { id: string };
              idToken?: string;
          };
          timestamp: number;
      }
    | {
          type: 'delete-board';
          payload: { id: string; idToken?: string };
          timestamp: number;
      }
    | {
          type: 'delete-list';
          payload: { id: string; idToken?: string };
          timestamp: number;
      }
    | {
          type: 'delete-card';
          payload: { id: string; idToken?: string };
          timestamp: number;
      }
    | {
          type: 'soft-delete-card';
          payload: { id: string; idToken?: string };
          timestamp: number;
      }
    | {
          type: 'restore-card';
          payload: { id: string; idToken?: string };
          timestamp: number;
      }
    | {
          type: 'move-board';
          payload: { id: string; newIndex: number; idToken?: string };
          timestamp: number;
      }
    | {
          type: 'move-list';
          payload: {
              id: string;
              newIndex: number;
              boardId: string;
              idToken?: string;
          };
          timestamp: number;
      }
    | {
          type: 'move-card';
          payload: {
              id: string;
              newIndex: number;
              listId: string;
              boardId: string;
              idToken?: string;
          };
          timestamp: number;
      }
    | {
          type: 'create-organization';
          payload: Omit<Organization, 'id'> & { idToken?: string };
          timestamp: number;
      }
    | {
          type: 'update-organization';
          payload: { data: Organization; idToken?: string };
          timestamp: number;
      }
    | {
          type: 'delete-organization';
          payload: { organizationId: string; idToken?: string };
          timestamp: number;
      }
    | {
          type: 'fetch-org-data';
          payload: { organizationId: string; idToken?: string };
          timestamp: number;
      }
    | {
          type: 'sync-complete';
          payload: { idToken?: string };
          timestamp: number;
      }
    | {
          type: 'error';
          payload: { message: string; idToken?: string };
          timestamp: number;
      };

// Utility: add optional organizationId into payloads for messages posted to the worker
type AddOrgToPayload<T> = T extends { payload: infer P }
    ? Omit<T, 'payload'> & { payload: P & { organizationId?: string | null } }
    : never;

export type SyncActionWithAuth = AddOrgToPayload<SyncAction>;

export type WorkerMessage =
    | { type: 'WORKER_READY'; timestamp: string; payload?: null }
    | { type: 'SYNC_ERROR'; payload: string; timestamp: string; error: Error }
    | {
          type: 'ACTION_SUCCESS';
          payload: {
              timestamp: number;
              tempId?: string;
              board?: Board;
              list?: BoardList;
              card?: BoardCard;
          };
      }
    | { type: 'SYNC_DATA'; payload: SyncAction }
    | SyncAction;
