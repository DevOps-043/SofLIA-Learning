import { NANOBANA_DOMAIN_KEYWORDS, NANOBANA_PATTERNS } from './nanobana-patterns'
import type { IntentResult, NanobananaDomain, OutputFormat } from './types'

export function detectNanoBananaIntent(
  messageLower: string,
  originalMessage: string,
): IntentResult {
  const entities: IntentResult['entities'] = {}
  const matchedPatterns = NANOBANA_PATTERNS.filter((pattern) => (
    pattern.test(originalMessage) || pattern.test(messageLower)
  )).length
  let confidence = resolveNanobanaConfidence(messageLower, matchedPatterns)
  const detectedDomain = detectNanobanaDomain(messageLower)
  const outputFormat = detectOutputFormat(messageLower)

  if (detectedDomain) {
    entities.nanobananaDomain = detectedDomain
    confidence += 0.1
  }

  if (outputFormat) {
    entities.outputFormat = outputFormat
  }

  return {
    intent: 'nanobana',
    confidence: Math.min(confidence, 0.95),
    entities: Object.keys(entities).length > 0 ? entities : undefined,
  }
}

function resolveNanobanaConfidence(messageLower: string, matchedPatterns: number): number {
  if (/\bnanobana(na)?\b/i.test(messageLower) || /\bnano\s*banana\b/i.test(messageLower)) return 0.95
  if (matchedPatterns >= 2) return 0.8
  if (matchedPatterns === 1) return 0.65
  return 0
}

function detectNanobanaDomain(messageLower: string): NanobananaDomain | undefined {
  const scores = Object.entries(NANOBANA_DOMAIN_KEYWORDS).map(([domain, keywords]) => ({
    domain: domain as NanobananaDomain,
    score: keywords.filter((keyword) => messageLower.includes(keyword)).length,
  }))
  const [winner] = scores.sort((a, b) => b.score - a.score)
  return winner.score > 0 ? winner.domain : undefined
}

function detectOutputFormat(messageLower: string): OutputFormat | undefined {
  if (messageLower.includes('wireframe') || messageLower.includes('esquema') || messageLower.includes('boceto')) {
    return 'wireframe'
  }
  if (messageLower.includes('mockup') || messageLower.includes('prototipo') || messageLower.includes('alta fidelidad')) {
    return 'mockup'
  }
  if (messageLower.includes('render') || messageLower.includes('final')) return 'render'
  if (messageLower.includes('diagrama') || messageLower.includes('flowchart')) return 'diagram'
  return undefined
}
