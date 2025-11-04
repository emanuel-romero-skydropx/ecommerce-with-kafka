export interface OrdersSyncWorkerConfig {
  groupId: string;
  pageLimit: number;
  requestDelayMs: number;
  maxRetries: number;
}
