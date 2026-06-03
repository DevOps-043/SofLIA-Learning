export const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash'
export const AI_BATCH_SIZE = 20
export const GLOBAL_MIN_MINUTES = 1
export const GLOBAL_MAX_MINUTES = 480

export function getGeminiApiKey(): string | null {
  return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || null
}
