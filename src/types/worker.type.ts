import type { Boards, Organization, Todo, User } from './appState.type';

type WorkerMessage =
    | {
          type: 'WORKER_READY';
          timestamp: string;
      }
    | {
          type: 'SYNC_USER_DATA';
          payload: User | null;
          timestamp: string;
      }
    | {
          type: 'SYNC_BOARD_DATA';
          payload: Boards[] | Array<Boards>;
          timestamp: string;
      }
    | {
          type: 'SYNC_TODO_DATA';
          payload: Todo[] | Array<Todo>;
          timestamp: string;
      }
    | {
          type: 'SYNC_ORGANIZATION_DATA';
          payload: Organization[] | Array<Organization>;
          timestamp: string;
      }
    | {
          type: 'SYNC_CANCEL';
          payload: string;
      }
    | {
          type: 'SYNC_ERROR';
          payload: any;
          timestamp: string;
          error: Error;
      }
    | {
          type: 'SYNC_RESULT';
          docId: string;
          success: boolean;
          payload?: any;
      }
    | {
          type: 'SYNC_DATA';
          payload: any;
      }
    | {
          type: 'PROCESSING_COMPLETE';
          payload: string;
      }
    | {
          type: 'PROCESSING_ERROR';
          payload: string;
      }
    | {
          type: 'ERROR';
          error: Error;
      };

export { type WorkerMessage };
