import { CREATE_PROMPT_PATTERNS, PROMPT_KEYWORDS } from './create-prompt-patterns'
import type { IntentResult } from './types'

export function detectCreatePromptIntent(
  messageLower: string,
  originalMessage: string,
): IntentResult {
  const entities: IntentResult['entities'] = {}
  const matchedPatterns = CREATE_PROMPT_PATTERNS.filter((pattern) => pattern.test(originalMessage)).length
  const keywordMatches = PROMPT_KEYWORDS.filter((keyword) => messageLower.includes(keyword.toLowerCase())).length
  let confidence = matchedPatterns > 0 ? Math.min(0.6 + matchedPatterns * 0.15, 0.95) : 0

  confidence += keywordMatches * 0.05

  const topicMatch = originalMessage.match(/prompt\s+(para|sobre|de|que)\s+([^.!?]+)/i)
  if (topicMatch) {
    entities.promptTopic = topicMatch[2].trim()
    confidence += 0.1
  }

  return {
    intent: 'create_prompt',
    confidence: Math.min(confidence, 0.95),
    entities: Object.keys(entities).length > 0 ? entities : undefined,
  }
}
