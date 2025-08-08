import type { Boards, Organization, Card, User } from './appState.type';

type WorkerMessage =
    | {
          type: 'WORKER_READY';
          timestamp: string;
          payload?: null;
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
          payload: Card[] | Array<Card>;
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
          payload: string;
          timestamp: string;
          error: Error;
      }
    | {
          type: 'SYNC_RESULT';
          docId: string;
          success: boolean;
          payload?: Record<string, unknown>;
      }
    | {
          type: 'SYNC_DATA';
          payload: Record<string, unknown>;
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
          payload?: Record<string, unknown>;
      };

export { type WorkerMessage };
