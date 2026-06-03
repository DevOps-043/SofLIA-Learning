export const AI_MODERATION_MODEL =
  process.env.AI_MODERATION_GEMINI_MODEL ||
  process.env.GEMINI_MODEL ||
  'gemini-3.5-flash'
export const AI_MODERATION_ENABLED =
  process.env.AI_MODERATION_ENABLED === 'true' ||
  process.env.GEMINI_MODERATION_ENABLED === 'true'
export const CONFIDENCE_THRESHOLD = Number.parseFloat(
  process.env.AI_MODERATION_CONFIDENCE_THRESHOLD || '0.7',
)
export const AUTO_BAN_THRESHOLD = Number.parseFloat(
  process.env.AI_MODERATION_AUTO_BAN_THRESHOLD || '0.95',
)
