export type RetryEnvelope = {
  key: string;
  reason: string;
  originalTopic: string;
  value?: string;
  retryCount: number;
};

export function computeExponentialBackoff(retryCount: number, baseMs = 100, maxMs = 10_000): number {
  const exponent = Math.max(0, retryCount - 1);
  const value = baseMs * Math.pow(2, exponent);
  return Math.min(value, maxMs);
}


