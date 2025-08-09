import type { Board, BoardList, BoardCard, User } from './appState.type';

export type WorkerMessage =
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
          payload: Board[] | Array<Board>;
          timestamp: string;
      }
    | {
          type: 'SYNC_TODO_DATA';
          payload: BoardCard[] | Array<BoardCard>;
          timestamp: string;
      }
    | {
          type: 'SYNC_ORGANIZATION_DATA';
          payload: any[] | Array<any>;
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
        type: 'ACTION_SUCCESS', 
        payload: { 
            timestamp: number; 
            tempId?: string; 
            board?: Board; 
            list?: BoardList; 
            card?: BoardCard 
        } 
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
        type: 'ERROR', 
        error: Error, 
        payload?: { 
            timestamp: number 
        } 
    }
    | { 
        type: 'FULL_DATA_RECEIVED', 
        payload: { 
            boards: Board[], 
            lists: BoardList[], 
            cards: BoardCard[] 
        } 
    };

