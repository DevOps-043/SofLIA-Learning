import { describe, expect, it } from 'vitest';

import { adminTranscodingReprocessSchema } from '../schema';

describe('adminTranscodingReprocessSchema', () => {
  it('accepts a valid reprocess payload and applies defaults', () => {
    const result = adminTranscodingReprocessSchema.safeParse({
      sourcePath: 'videos/course-intro.mp4',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bucket).toBe('course-videos');
      expect(result.data.contentType).toBe('video/mp4');
    }
  });

  it('rejects empty source paths', () => {
    const result = adminTranscodingReprocessSchema.safeParse({ sourcePath: '   ' });

    expect(result.success).toBe(false);
  });

  it('rejects unsupported content types', () => {
    const result = adminTranscodingReprocessSchema.safeParse({
      contentType: 'application/pdf',
      sourcePath: 'videos/course-intro.pdf',
    });

    expect(result.success).toBe(false);
  });
});
