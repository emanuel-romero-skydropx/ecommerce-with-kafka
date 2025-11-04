export interface IdempotencyStorePort {
  /** Atomically set the key if absent and return true if it was set */
  setIfAbsent(key: string, ttlSeconds?: number): Promise<boolean>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}


