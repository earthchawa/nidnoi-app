import { describe, expect, it, vi } from 'vitest';
import { TransientError, withRetry } from './retry.ts';

const noSleep = vi.fn(async () => {});

describe('withRetry', () => {
  it('retries transient errors and returns the first success', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new TransientError('503'))
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValue('ok');
    const sleep = vi.fn(async () => {});
    await expect(withRetry(fn, { delaysMs: [10, 20, 30], sleep })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls).toEqual([[10], [20]]);
  });

  it('gives up after the last delay', async () => {
    const fn = vi.fn().mockRejectedValue(new TransientError('503'));
    await expect(withRetry(fn, { delaysMs: [1, 1], sleep: noSleep })).rejects.toThrow('503');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry permanent errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('API error 400'));
    await expect(withRetry(fn, { delaysMs: [1, 1], sleep: noSleep })).rejects.toThrow('400');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
