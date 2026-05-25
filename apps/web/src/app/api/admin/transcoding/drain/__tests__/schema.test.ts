import { describe, expect, it } from 'vitest';

import { adminTranscodingDrainSchema } from '../schema';

describe('adminTranscodingDrainSchema', () => {
  it('accepts a valid concurrency value', () => {
    const result = adminTranscodingDrainSchema.safeParse({ concurrency: 5 });

    expect(result.success).toBe(true);
  });

  it('defaults concurrency when the body is empty', () => {
    const result = adminTranscodingDrainSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.concurrency).toBe(10);
    }
  });

  it('rejects concurrency above the safe cap', () => {
    const result = adminTranscodingDrainSchema.safeParse({ concurrency: 25 });

    expect(result.success).toBe(false);
  });
});
