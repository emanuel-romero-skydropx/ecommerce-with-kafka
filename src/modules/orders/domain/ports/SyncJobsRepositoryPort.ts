export type SyncJobStatus = 'in_progress' | 'completed' | 'failed';

export interface SyncJobState {
  shopId: string;
  status: SyncJobStatus;
  lastPageInfo?: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface SyncJobsRepositoryPort {
  startJob(shopId: string): Promise<void>;
  markPageProcessed(shopId: string, nextPageInfo?: string): Promise<void>;
  markCompleted(shopId: string): Promise<void>;
}


