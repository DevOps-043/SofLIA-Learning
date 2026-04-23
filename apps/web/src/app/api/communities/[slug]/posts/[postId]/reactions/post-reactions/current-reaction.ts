import type { CommunityReactionRow } from './types';

export function getUserCurrentReaction(
  reactions: CommunityReactionRow[],
  userId: string
) {
  const userReaction = reactions.find((reaction) => reaction.user_id === userId);

  return userReaction ? userReaction.reaction_type : null;
}
