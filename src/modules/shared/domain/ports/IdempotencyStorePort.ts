export interface IdempotencyStorePort {
  setIfAbsent(key: string, ttlSeconds?: number): Promise<boolean>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
}


