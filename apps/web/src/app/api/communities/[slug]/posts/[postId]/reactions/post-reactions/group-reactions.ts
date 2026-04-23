import { getReactionEmoji } from './reaction-emoji';
import { getReactionUserName } from './reaction-user';
import type { CommunityReactionRow, GroupedReaction } from './types';

export function groupReactionsByType(
  reactions: CommunityReactionRow[],
  currentUserId: string
) {
  return reactions.reduce<Record<string, GroupedReaction>>((acc, reaction) => {
    const type = reaction.reaction_type;
    acc[type] ??= {
      type,
      count: 0,
      users: [],
      hasUserReacted: false,
      emoji: getReactionEmoji(type),
    };

    acc[type].count++;
    acc[type].users.push({
      id: reaction.user.id,
      name: getReactionUserName(reaction.user),
      avatar: reaction.user.profile_picture_url,
      reaction_type: reaction.reaction_type,
      created_at: reaction.created_at,
    });

    if (reaction.user_id === currentUserId) {
      acc[type].hasUserReacted = true;
    }

    return acc;
  }, {});
}
