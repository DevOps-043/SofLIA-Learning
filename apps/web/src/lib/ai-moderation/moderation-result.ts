import { AUTO_BAN_THRESHOLD, CONFIDENCE_THRESHOLD } from './config'
import type { AIModerationResult } from './types'

export function requiresHumanReview(
  isInappropriate: boolean,
  confidence: number,
): boolean {
  return (
    isInappropriate &&
    confidence < AUTO_BAN_THRESHOLD &&
    confidence >= CONFIDENCE_THRESHOLD
  )
}

export function createDisabledResult(startTime: number): AIModerationResult {
  return {
    isInappropriate: false,
    confidence: 0,
    categories: [],
    reasoning: 'AI moderation disabled',
    requiresHumanReview: false,
    processingTimeMs: Date.now() - startTime,
  }
}

export function createErrorResult(
  startTime: number,
  prefix: string,
  error: unknown,
): AIModerationResult {
  return {
    isInappropriate: false,
    confidence: 0,
    categories: ['error'],
    reasoning: `${prefix}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    requiresHumanReview: true,
    processingTimeMs: Date.now() - startTime,
  }
}

export function shouldAutoBan(result: AIModerationResult): boolean {
  return result.isInappropriate && result.confidence >= AUTO_BAN_THRESHOLD
}
