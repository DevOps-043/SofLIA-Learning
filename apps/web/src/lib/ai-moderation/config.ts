import OpenAI from 'openai'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
export const AI_MODERATION_ENABLED =
  process.env.OPENAI_MODERATION_ENABLED === 'true'
export const CONFIDENCE_THRESHOLD = Number.parseFloat(
  process.env.AI_MODERATION_CONFIDENCE_THRESHOLD || '0.7',
)
export const AUTO_BAN_THRESHOLD = Number.parseFloat(
  process.env.AI_MODERATION_AUTO_BAN_THRESHOLD || '0.95',
)

export const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null
