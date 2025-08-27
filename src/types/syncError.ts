export type SyncError = {
  id: string; // unique id for the error record (could be uuid)
  jobId?: string; // optional related queue job id
  type: string; // e.g. 'create:card' | 'update:list' | 'delete:board'
  message: string; // human readable error message
  retryCount: number; // how many times we've retried
  lastAttempt?: number; // epoch ms when last attempted
  createdAt: number; // epoch ms when created
};

export type NewSyncError = Omit<SyncError, 'id' | 'createdAt' | 'retryCount'> & {
  id?: string;
};

export function makeSyncError(partial: NewSyncError): SyncError {
  return {
    id: partial.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    jobId: partial.jobId,
    type: partial.type,
    message: partial.message,
    retryCount: 0,
    lastAttempt: partial.lastAttempt,
    createdAt: Date.now(),
  };
}
export type SyncErrorRecord = {
  id: string;
  message: string;
  actionId?: string;
  retryCount?: number;
  lastAttempt?: number | null;
  createdAt: string; // ISO
};
