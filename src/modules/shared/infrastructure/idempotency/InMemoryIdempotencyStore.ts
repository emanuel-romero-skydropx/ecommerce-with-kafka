import type { IdempotencyStorePort } from '../../domain/ports/IdempotencyStorePort';

type Stored = { expiresAt?: number };

export class InMemoryIdempotencyStore implements IdempotencyStorePort {
  private readonly storage = new Map<string, Stored>();

  async setIfAbsent(key: string, ttlSeconds?: number): Promise<boolean> {
    this.cleanupIfExpired(key);
    if (this.storage.has(key)) return false;
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.storage.set(key, { expiresAt });
    return true;
  }

  async has(key: string): Promise<boolean> {
    this.cleanupIfExpired(key);
    return this.storage.has(key);
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  private cleanupIfExpired(key: string): void {
    const entry = this.storage.get(key);
    if (!entry) return;
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.storage.delete(key);
    }
  }
}


