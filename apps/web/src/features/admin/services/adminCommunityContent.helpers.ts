export type CommunityUser = {
  id?: string
  display_name?: string | null
  first_name?: string | null
  last_name?: string | null
  profile_picture_url?: string | null
}

export type CommunityPostRecord = {
  id: string
  content: string | null
  attachment_url?: string | null
  attachment_type?: string | null
  likes_count?: number | null
  comments_count?: number | null
  is_pinned?: boolean | null
  is_hidden?: boolean | null
  is_edited?: boolean | null
  edited_at?: string | null
  created_at: string
  updated_at?: string | null
  user_id?: string | null
}

export type CommunityCommentRecord = {
  id: string
  post_id: string
  content: string
  created_at: string
  author_id?: string | null
  users?: CommunityUser | null
}

export type CommunityReactionRecord = {
  id: string
  post_id: string
  reaction_type?: string | null
  emoji?: string | null
  users?: CommunityUser | null
}

export type CommunityReactionGroup = {
  type: string
  emoji: string
  count: number
  users: Array<CommunityUser | null>
}

export type CommunityPostAttachment = {
  url?: string | null
  type?: string | null
  name?: string
}

export type CommunityBuiltPost = CommunityPostRecord & {
  content: string
  users: CommunityUser | null
  comments: CommunityCommentRecord[]
  reactions: CommunityReactionGroup[]
  attachments: CommunityPostAttachment[]
  links: unknown[]
  views_count: number
  post_type: 'text'
}

export type CommunityVideoRecord = {
  id: string
  video_type: string | null
  title: string
  description: string | null
  video_url: string | null
  video_provider: string | null
  thumbnail_url: string | null
  duration: number | null
  order_index: number | null
  is_active: boolean | null
  metadata: unknown
  created_at: string
  updated_at: string
}

export function groupCommentsByPost(comments: CommunityCommentRecord[]) {
  return comments.reduce<Map<string, CommunityCommentRecord[]>>((grouped, comment) => {
    const previousComments = grouped.get(comment.post_id)
    if (!previousComments) {
      grouped.set(comment.post_id, [comment])
      return grouped
    }

    if (previousComments.length < 10) {
      previousComments.push(comment)
    }

    return grouped
  }, new Map())
}

export function groupReactionsByPost(reactions: CommunityReactionRecord[]) {
  const groupedByPost = new Map<string, Map<string, CommunityReactionGroup>>()

  for (const reaction of reactions) {
    const postGroups = groupedByPost.get(reaction.post_id) || new Map()
    const reactionKey = reaction.reaction_type || 'like'
    const previousReaction = postGroups.get(reactionKey) || {
      type: reactionKey,
      emoji: reaction.emoji || '👍',
      count: 0,
      users: []
    }

    previousReaction.count += 1
    previousReaction.users.push(reaction.users || null)
    postGroups.set(reactionKey, previousReaction)
    groupedByPost.set(reaction.post_id, postGroups)
  }

  return Array.from(groupedByPost.entries()).reduce<Map<string, CommunityReactionGroup[]>>(
    (accumulator, [postId, groupedReactions]) => {
      accumulator.set(postId, Array.from(groupedReactions.values()))
      return accumulator
    },
    new Map()
  )
}

export function buildCommunityPosts(
  posts: CommunityPostRecord[],
  usersById: Map<string, CommunityUser>,
  commentsByPost: Map<string, CommunityCommentRecord[]>,
  reactionsByPost: Map<string, CommunityReactionGroup[]>
): CommunityBuiltPost[] {
  return posts.map(post => ({
    ...post,
    content: post.content || '',
    users: (post.user_id && usersById.get(post.user_id)) || null,
    comments: commentsByPost.get(post.id) || [],
    reactions: reactionsByPost.get(post.id) || [],
    attachments: post.attachment_url
      ? [{ url: post.attachment_url, type: post.attachment_type, name: 'Archivo adjunto' }]
      : [],
    links: [],
    views_count: 0,
    post_type: 'text'
  }))
}
