import { REACTION_EMOJIS } from './constants';

export function getReactionEmoji(type: string): string {
  return REACTION_EMOJIS[type] || REACTION_EMOJIS.like;
}
