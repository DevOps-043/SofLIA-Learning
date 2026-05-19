import { describe, expect, it } from 'vitest';

import { reelCommentSchema, reelUpdateSchema } from '../_schemas';

describe('reels schemas', () => {
  it('trims comment content', () => {
    const result = reelCommentSchema.safeParse({ content: '  buen reel  ' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe('buen reel');
    }
  });

  it('rejects blank comments', () => {
    const result = reelCommentSchema.safeParse({ content: '   ' });

    expect(result.success).toBe(false);
  });

  it('defaults missing hashtags on reel updates', () => {
    const result = reelUpdateSchema.safeParse({ title: '  Demo  ' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        hashtags: [],
        title: 'Demo',
      });
    }
  });
});
