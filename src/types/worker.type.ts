import type {
    Board,
    BoardList,
    BoardCard,
    Organization,
} from './appState.type';

export type SyncAction =
    | {
          type: 'create-board';
          payload: { data: Board; tempId: string; idToken?: string };
          timestamp: number;
      }
    | {
          type: 'update-board';
          payload: { data: Board; idToken?: string };
          timestamp: number;
      }
    | {
          type: 'create-list';
          payload: {
              data: BoardList;
              boardId: string;
              tempId: string;
              idToken?: string;
          };
          timestamp: number;
      }
    | {
          type: 'update-list';
          payload: { data: BoardList; idToken?: string };
          timestamp: number;
      }
    | {
          type: 'create-card';
          payload: {
              data: BoardCard;
              boardId: string;
              listId: string;
              tempId: string;
              idToken?: string;
          };
          timestamp: number;
      }
    | {
          type: 'update-card';
          payload: { data: BoardCard; idToken?: string };
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
