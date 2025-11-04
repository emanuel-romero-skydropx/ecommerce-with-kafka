import 'reflect-metadata';
import { injectable } from 'inversify';
import { SyncJobModel } from './Job.schema';
import type { SyncJobsRepositoryPort } from '../../../domain/ports/SyncJobsRepositoryPort';

@injectable()
export class MongoSyncJobsRepository implements SyncJobsRepositoryPort {
  async startJob(shopId: string): Promise<void> {
    await SyncJobModel.updateOne(
      { shopId },
      { $set: { status: 'in_progress' as const }, $unset: { lastPageInfo: '' } },
      { upsert: true }
    );
  }

  async markPageProcessed(shopId: string, nextPageInfo?: string): Promise<void> {
    await SyncJobModel.updateOne({ shopId }, { $set: { lastPageInfo: nextPageInfo } }, { upsert: true });
  }

  async markCompleted(shopId: string): Promise<void> {
    await SyncJobModel.updateOne({ shopId }, { $set: { status: 'completed' as const }, $unset: { lastPageInfo: '' } }, { upsert: true });
  }
}


