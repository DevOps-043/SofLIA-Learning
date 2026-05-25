import { IGNORED_LEAF_KEYS, MAX_RECURSION_DEPTH, PRIORITIZED_FIELD_KEYS } from './constants'
import { escapeHtml, hasMeaningfulStringContent } from './html'
import { deepParseJsonValue, extractJsonLikeStringSegments } from './json'
import { isQuizLikeContent } from './quiz'

export function collectContentSegments(value: unknown, depth = 0): string[] {
  if (depth > MAX_RECURSION_DEPTH || value === null || value === undefined) return []

  const parsed = deepParseJsonValue(value)
  if (typeof parsed === 'string') return collectStringSegments(parsed)
  if (typeof parsed === 'number' || typeof parsed === 'boolean') return [String(parsed)]
  if (Array.isArray(parsed)) return parsed.flatMap((item) => collectContentSegments(item, depth + 1))
  if (!parsed || typeof parsed !== 'object') return []

  return collectRecordSegments(parsed as Record<string, unknown>, depth)
}

function collectStringSegments(value: string): string[] {
  const trimmed = value.trim()
  const extractedSegments = extractJsonLikeStringSegments(trimmed)
  if (extractedSegments.length > 0) return extractedSegments
  return hasMeaningfulStringContent(trimmed) ? [trimmed] : []
}

function collectRecordSegments(record: Record<string, unknown>, depth: number): string[] {
  if (isQuizLikeContent(record)) return []

  const dialogueLine = collectDialogueLine(record)
  if (dialogueLine) return [dialogueLine]

  if (Array.isArray(record.content_blocks)) {
    return record.content_blocks.flatMap((block) => collectContentSegments(block, depth + 1))
  }

  if (Array.isArray(record.scenes)) {
    return [
      ...collectContentSegments(record.introduction, depth + 1),
      ...record.scenes.flatMap((scene) => collectContentSegments(scene, depth + 1)),
      ...collectContentSegments(record.conclusion, depth + 1),
      ...collectContentSegments(record.reflection_prompt, depth + 1),
    ]
  }

  if (record.type === 'html' && typeof record.content === 'string' && record.content.trim()) {
    const title = typeof record.title === 'string' ? record.title.trim() : ''
    return title ? [`<h3>${escapeHtml(title)}</h3>${record.content}`] : [record.content]
  }

  const prioritizedSegments = PRIORITIZED_FIELD_KEYS.flatMap((key) =>
    collectContentSegments(record[key], depth + 1),
  )
  return prioritizedSegments.length > 0 ? prioritizedSegments : collectLeafText(record, depth)
}

function collectDialogueLine(record: Record<string, unknown>): string | null {
  if (typeof record.character !== 'string' || typeof record.message !== 'string') {
    return null
  }

  const character = record.character.trim()
  const message = record.message.trim()
  return character && message ? `${character}: ${message}` : null
}

function collectLeafText(record: Record<string, unknown>, depth: number): string[] {
  return Object.entries(record).flatMap(([key, value]) => (
    IGNORED_LEAF_KEYS.has(key) ? [] : collectContentSegments(value, depth + 1)
  ))
}
