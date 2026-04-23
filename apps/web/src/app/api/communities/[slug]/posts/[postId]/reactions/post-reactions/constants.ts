export const VALID_REACTIONS = [
  'like',
  'love',
  'laugh',
  'wow',
  'sad',
  'angry',
] as const;

export const REACTION_EMOJIS: Record<string, string> = {
  like: '👍',
  love: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡',
};
