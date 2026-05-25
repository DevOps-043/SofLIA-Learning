import { describe, expect, it } from 'vitest';
import {
  batchCommunityPostReactionsSchema,
  createCommunityCommentSchema,
  createCommunityPostSchema,
  pollVoteSchema,
  reportCommunityPostSchema,
} from '../_schemas';

describe('community API schemas', () => {
  it('accepts a community post with structured attachment data', () => {
    const result = createCommunityPostSchema.safeParse({
      title: 'Encuesta semanal',
      content: '<p>Elige una opcion</p>',
      attachment_type: 'poll',
      attachment_data: {
        options: ['A', 'B'],
        votes: { A: [], B: [] },
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects empty post content', () => {
    const result = createCommunityPostSchema.safeParse({ content: '' });

    expect(result.success).toBe(false);
  });

  it('normalizes empty parent comment ids to null', () => {
    const result = createCommunityCommentSchema.safeParse({
      content: 'Gracias por compartir',
      parent_comment_id: '',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.parent_comment_id).toBeNull();
    }
  });

  it('validates poll vote actions and report reasons', () => {
    expect(
      pollVoteSchema.safeParse({ option: 'A', action: 'vote' }).success,
    ).toBe(true);
    expect(
      reportCommunityPostSchema.safeParse({ reason_category: 'spam' }).success,
    ).toBe(true);
    expect(
      pollVoteSchema.safeParse({ option: 'A', action: 'toggle' }).success,
    ).toBe(false);
  });

  it('requires batch reaction ids to be UUIDs', () => {
    const result = batchCommunityPostReactionsSchema.safeParse({
      postIds: ['not-a-uuid'],
    });

    expect(result.success).toBe(false);
  });
});
