export type SyncErrorRecord = {
  id: string;
  message: string;
  actionId?: string;
  retryCount?: number;
  lastAttempt?: number | null;
  createdAt: string; // ISO
};
