import { describe, expect, it } from 'vitest';

import { adminVideoDurationSchema } from '../schema';

describe('adminVideoDurationSchema', () => {
  it('accepts a valid hosted video payload', () => {
    const result = adminVideoDurationSchema.safeParse({
      provider: 'vimeo',
      videoIdOrUrl: 'https://vimeo.com/123456789',
    });

    expect(result.success).toBe(true);
  });

  it('rejects unsupported providers', () => {
    const result = adminVideoDurationSchema.safeParse({
      provider: 'wistia',
      videoIdOrUrl: 'https://example.com/video',
    });

    expect(result.success).toBe(false);
  });

  it('rejects blank video identifiers', () => {
    const result = adminVideoDurationSchema.safeParse({
      provider: 'youtube',
      videoIdOrUrl: '   ',
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown fields', () => {
    const result = adminVideoDurationSchema.safeParse({
      provider: 'custom',
      tenantId: 'not-allowed',
      videoIdOrUrl: 'https://cdn.example.com/video.mp4',
    });

    expect(result.success).toBe(false);
  });
});
