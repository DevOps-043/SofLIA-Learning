import {
  isSupportedExternalToolKey,
  type ExternalToolKey,
} from '../../types/activity-config'
import type { ExternalToolDetectionInput } from './types'

const externalToolMatchers: Array<{ key: ExternalToolKey; patterns: RegExp[] }> = [
  { key: 'chatgpt', patterns: [/\bchatgpt\b/i] },
  { key: 'gemini', patterns: [/\bgemini\b/i] },
  { key: 'notebooklm', patterns: [/\bnotebook\s?lm\b/i] },
  { key: 'gamma', patterns: [/\bgamma\b/i] },
  { key: 'atlas', patterns: [/\batlas\b/i] },
]

function normalizeExternalToolKey(value: unknown): ExternalToolKey | null {
  return isSupportedExternalToolKey(value) ? value : null
}

function detectExternalToolKeyFromText(value: string): ExternalToolKey | null {
  for (const matcher of externalToolMatchers) {
    if (matcher.patterns.some((pattern) => pattern.test(value))) {
      return matcher.key
    }
  }
  return null
}

function contentSuggestsExternalToolInteraction(value: string): boolean {
  if (!value.trim()) return false

  return [
    /\bcopia(?:r)?\b[\s\S]{0,80}\bprompt\b/i,
    /\bpega(?:r)?\b[\s\S]{0,80}\b(chatgpt|gemini|notebook\s?lm|gamma|atlas)\b/i,
    /\babre?(?:\s+en|\s+la)?\b[\s\S]{0,80}\b(chatgpt|gemini|notebook\s?lm|gamma|atlas)\b/i,
    /\bve\s+a\b[\s\S]{0,80}\b(chatgpt|gemini|notebook\s?lm|gamma|atlas)\b/i,
    /\busa\b[\s\S]{0,40}\b(chatgpt|gemini|notebook\s?lm|gamma|atlas)\b[\s\S]{0,80}\b(para pegar|para abrir|en una ventana|prompt)\b/i,
  ].some((pattern) => pattern.test(value))
}

export function detectExternalToolKey(input: ExternalToolDetectionInput): ExternalToolKey | null {
  const explicitToolKey =
    input.rawConfig?.toolTask?.toolKey ??
    normalizeExternalToolKey(input.rawExternalToolKey)

  if (explicitToolKey) return explicitToolKey

  const fromPrompts = detectExternalToolKeyFromText(input.aiPrompts.join('\n'))
  if (fromPrompts) return fromPrompts

  return contentSuggestsExternalToolInteraction(input.activityContent)
    ? detectExternalToolKeyFromText(input.activityContent)
    : null
}
