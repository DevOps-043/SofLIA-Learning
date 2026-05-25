import { describe, expect, it } from 'vitest';

import { adminTranscodingScanAndQueueSchema } from '../schema';

describe('adminTranscodingScanAndQueueSchema', () => {
  it('accepts a valid scan-and-queue payload', () => {
    const result = adminTranscodingScanAndQueueSchema.safeParse({
      bucket: 'course-videos',
      concurrency: 4,
      folder: 'videos',
    });

    expect(result.success).toBe(true);
  });

  it('applies safe defaults when the body is empty', () => {
    const result = adminTranscodingScanAndQueueSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        bucket: 'course-videos',
        concurrency: 10,
        folder: 'videos',
      });
    }
  });

  it('rejects unknown fields', () => {
    const result = adminTranscodingScanAndQueueSchema.safeParse({
      bucket: 'course-videos',
      dryRun: true,
      folder: 'videos',
    });

    expect(result.success).toBe(false);
  });
});
