import mongoose from 'mongoose';
import type { Logger } from 'pino';

export async function connectToMongoDB(uri: string, logger: Logger): Promise<void> {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    logger.info('Successfully connected to MongoDB');
  } catch (error) {
    logger.error(error, 'Error connecting to MongoDB');
    process.exit(1);
  }
}
