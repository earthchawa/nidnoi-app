// Retries a request when the API is temporarily busy (rate limits, overload, network drops).

/** An error worth retrying, e.g. HTTP 429/5xx. Anything else fails immediately. */
export class TransientError extends Error {}

const TRANSIENT_STATUS = new Set([408, 429, 500, 502, 503, 504]);
export const isTransientStatus = (status: number) => TRANSIENT_STATUS.has(status);

export interface RetryOptions {
  /** Waits between attempts in ms; the number of entries is the number of retries. */
  delaysMs?: number[];
  sleep?: (ms: number) => Promise<void>;
  onRetry?: (error: Error, attempt: number, waitMs: number) => void;
}

// 30s, 1m, 2m, 4m, 8m: about 15 minutes in total, well inside a GitHub Actions job.
const DEFAULT_DELAYS = [30_000, 60_000, 120_000, 240_000, 480_000];
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { delaysMs = DEFAULT_DELAYS, sleep = wait, onRetry } = options;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      // fetch() throws TypeError on network failures; those are worth retrying too.
      const transient = err instanceof TransientError || err instanceof TypeError;
      if (!transient || attempt >= delaysMs.length) throw err;
      const waitMs = delaysMs[attempt];
      onRetry?.(err as Error, attempt + 1, waitMs);
      await sleep(waitMs);
    }
  }
}
