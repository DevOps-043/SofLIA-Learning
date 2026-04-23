import { logger } from '@/lib/utils/logger';
import { CommunityPostRecord } from './types';

export function enrichPostsWithReactions(
  posts: CommunityPostRecord[],
  userReactionsMap: Record<string, string>
) {
  return posts.map((post) => {
    const userReaction = userReactionsMap[post.id] ?? null;

    if (post.attachment_type === 'poll') {
      logger.log('Poll post found with data:', { id: post.id, attachment: post.attachment_data });
    }

    return {
      ...post,
      user_has_liked: userReaction === 'like',
      user_reaction_type: userReaction,
    };
  });
}
