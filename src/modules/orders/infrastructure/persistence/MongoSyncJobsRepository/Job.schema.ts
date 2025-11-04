import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type SyncJobDocument = Document & {
  shopId: string;
  status: 'in_progress' | 'completed' | 'failed';
  lastPageInfo?: string;
  createdAt: Date;
  updatedAt: Date;
};

const SyncJobSchema = new Schema<SyncJobDocument>(
  {
    shopId: { type: String, required: true, index: true, unique: true },
    status: { type: String, required: true, enum: ['in_progress', 'completed', 'failed'], index: true },
    lastPageInfo: { type: String, required: false }
  },
  { timestamps: true, versionKey: false }
);

export const SyncJobModel: Model<SyncJobDocument> =
  mongoose.models.SyncJob || mongoose.model<SyncJobDocument>('SyncJob', SyncJobSchema);


