import { NAVIGATE_PATTERNS, NAVIGATION_KEYWORDS, SITE_PAGES } from './navigation-patterns'
import type { IntentResult } from './types'

export function detectNavigateIntent(messageLower: string): IntentResult {
  const entities: IntentResult['entities'] = {}
  const matchedPatterns = NAVIGATE_PATTERNS.filter((pattern) => pattern.test(messageLower)).length
  const navigationKeywordMatches = NAVIGATION_KEYWORDS.filter((keyword) => (
    messageLower.includes(keyword.toLowerCase())
  )).length
  let confidence = matchedPatterns > 0 ? Math.min(0.6 + matchedPatterns * 0.15, 0.85) : 0

  if (navigationKeywordMatches > 0) {
    confidence += navigationKeywordMatches * 0.1
    if (matchedPatterns > 0) confidence = Math.max(confidence, 0.8)
  }

  const targetPage = detectTargetPage(messageLower)
  if (targetPage) {
    entities.targetPage = targetPage
    confidence += 0.1
  }

  return {
    intent: 'navigate',
    confidence: Math.min(confidence, 0.9),
    entities: Object.keys(entities).length > 0 ? entities : undefined,
  }
}

function detectTargetPage(messageLower: string): string | undefined {
  for (const [page, keywords] of Object.entries(SITE_PAGES)) {
    if (keywords.some((keyword) => messageLower.includes(keyword))) {
      return page
    }
  }

  return undefined
}
