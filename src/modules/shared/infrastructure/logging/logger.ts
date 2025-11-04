import pino, { type Logger, type LoggerOptions } from 'pino';

export function createLogger(options?: LoggerOptions): Logger {
  if (options) return pino(options);
  const isProd = process.env.NODE_ENV === 'production';
  return pino(
    isProd
      ? { level: 'info' }
      : { transport: { target: 'pino-pretty' } }
  );
}
