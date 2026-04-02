import { describe, expect, it } from 'vitest'
import {
  buildCommunityPosts,
  groupCommentsByPost,
  groupReactionsByPost
} from '../adminCommunityContent.helpers'

describe('adminCommunityContent.helpers', () => {
  it('groups comments by post and keeps the first 10 chronologically', () => {
    const comments = Array.from({ length: 12 }, (_, index) => ({
      id: `${index}`,
      post_id: 'post-1',
      content: `comment-${index}`,
      created_at: `2026-04-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`
    }))

    const grouped = groupCommentsByPost(comments)

    expect(grouped.get('post-1')).toHaveLength(10)
    expect(grouped.get('post-1')?.[0].content).toBe('comment-0')
    expect(grouped.get('post-1')?.[9].content).toBe('comment-9')
  })

  it('groups reactions by post and reaction type', () => {
    const grouped = groupReactionsByPost([
      { id: '1', post_id: 'post-1', reaction_type: 'like', emoji: '👍', users: { display_name: 'Ada' } },
      { id: '2', post_id: 'post-1', reaction_type: 'like', emoji: '👍', users: { display_name: 'Linus' } },
      { id: '3', post_id: 'post-1', reaction_type: 'love', emoji: '❤️', users: { display_name: 'Grace' } }
    ])

    expect(grouped.get('post-1')).toEqual([
      { type: 'like', emoji: '👍', count: 2, users: [{ display_name: 'Ada' }, { display_name: 'Linus' }] },
      { type: 'love', emoji: '❤️', count: 1, users: [{ display_name: 'Grace' }] }
    ])
  })

  it('builds posts with grouped comments, reactions and attachments', () => {
    const posts = buildCommunityPosts(
      [
        {
          id: 'post-1',
          content: 'Hello',
          attachment_url: 'https://cdn/file.pdf',
          attachment_type: 'pdf',
          created_at: '2026-04-01T10:00:00.000Z',
          user_id: 'user-1'
        }
      ],
      new Map([['user-1', { id: 'user-1', display_name: 'Ada' }]]),
      new Map([['post-1', [{ id: 'comment-1', post_id: 'post-1', content: 'Nice', created_at: '2026-04-01T11:00:00.000Z' }]]]),
      new Map([['post-1', [{ type: 'like', emoji: '👍', count: 1, users: [] }]]])
    )

    expect(posts[0]).toMatchObject({
      users: { id: 'user-1', display_name: 'Ada' },
      comments: [{ id: 'comment-1', content: 'Nice' }],
      reactions: [{ type: 'like', count: 1 }],
      attachments: [{ url: 'https://cdn/file.pdf', type: 'pdf', name: 'Archivo adjunto' }]
    })
  })
})
