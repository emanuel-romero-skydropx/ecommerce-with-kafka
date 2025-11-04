import 'reflect-metadata';
import { bootstrap } from './app';

bootstrap().catch((error) => {

  console.error('Unhandled error during bootstrap:', error);
  process.exit(1);
});


