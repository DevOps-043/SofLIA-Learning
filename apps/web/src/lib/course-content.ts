const JSON_LIKE_PATTERN = /^\s*[[{"].*$/s
const MAX_PARSE_DEPTH = 3
const MAX_RECURSION_DEPTH = 8
const JSON_LIKE_FIELD_PATTERN =
  /"([A-Za-z_][\w]*)"\s*:\s*"([\s\S]*?)"\s*(?=,\s*"[A-Za-z_][\w]*"\s*:|\s*\}$)/g

function looksLikeHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value)
}

function decodeCommonHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
}

function stripHtml(value: string): string {
  return decodeCommonHtmlEntities(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
}

function hasMeaningfulStringContent(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }

  if (!looksLikeHtml(trimmed)) {
    return true
  }

  const textOnly = stripHtml(trimmed).replace(/\s+/g, ' ').trim()
  if (textOnly) {
    return true
  }

  return /<(img|video|audio|iframe|embed|object|svg|table)\b/i.test(trimmed)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function repairJsonLikeString(value: string): string {
  let result = ''
  let inString = false
  let escaped = false

  for (const char of value) {
    if (escaped) {
      result += char
      escaped = false
      continue
    }

    if (char === '\\') {
      result += char
      escaped = true
      continue
    }

    if (char === '"') {
      result += char
      inString = !inString
      continue
    }

    if (inString && char === '\n') {
      result += '\\n'
      continue
    }

    if (inString && char === '\r') {
      result += '\\r'
      continue
    }

    if (inString && char === '\t') {
      result += '\\t'
      continue
    }

    result += char
  }

  return result
}

function decodeJsonLikeStringValue(value: string): string {
  return value
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\')
}

function extractJsonLikeStringSegments(value: string): string[] {
  const trimmed = value.trim()
  if (!trimmed.startsWith('{')) {
    return []
  }

  const prioritizedKeys = new Set([
    'title',
    'subtitle',
    'heading',
    'introduction',
    'instructions',
    'text',
    'content',
    'body',
    'description',
    'prompt',
    'question',
    'message',
    'children',
    'closing',
    'reflectionQuestion',
    'reflection_prompt',
  ])

  const matches = Array.from(trimmed.matchAll(JSON_LIKE_FIELD_PATTERN)).filter(
    (match) => prioritizedKeys.has(match[1])
  )

  return matches.flatMap((match) => {
    const decoded = decodeJsonLikeStringValue(match[2]).trim()
    return hasMeaningfulStringContent(decoded) ? [decoded] : []
  })
}

function tryParseJson(value: string): unknown {
  const trimmed = value.trim()
  if (!trimmed || !JSON_LIKE_PATTERN.test(trimmed)) {
    return value
  }

  try {
    return JSON.parse(trimmed)
  } catch {
    try {
      return JSON.parse(repairJsonLikeString(trimmed))
    } catch {
      return value
    }
  }
}

export function deepParseJsonValue(value: unknown): unknown {
  let current = value

  for (let depth = 0; depth < MAX_PARSE_DEPTH; depth += 1) {
    if (typeof current !== 'string') {
      break
    }

    const parsed = tryParseJson(current)
    if (parsed === current) {
      break
    }

    current = parsed
  }

  return current
}

function isQuizLikeContent(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  const record = value as Record<string, unknown>
  return Array.isArray(record.questions) || Array.isArray(record.items)
}

function collectLeafText(record: Record<string, unknown>, depth: number): string[] {
  const ignoredKeys = new Set([
    'id',
    'type',
    'order',
    'emotion',
    'character',
    'questionType',
    'question_type',
    'correctAnswer',
    'correct_answer',
    'points',
    'difficulty',
    'bloom_level',
    'passing_score',
    'totalPoints',
    'total_points',
    'is_required',
    'is_downloadable',
  ])

  const segments: string[] = []

  for (const [key, value] of Object.entries(record)) {
    if (ignoredKeys.has(key)) {
      continue
    }

    segments.push(...collectContentSegments(value, depth + 1))
  }

  return segments
}

function collectContentSegments(value: unknown, depth = 0): string[] {
  if (depth > MAX_RECURSION_DEPTH || value === null || value === undefined) {
    return []
  }

  const parsed = deepParseJsonValue(value)

  if (typeof parsed === 'string') {
    const trimmed = parsed.trim()
    const extractedSegments = extractJsonLikeStringSegments(trimmed)
    if (extractedSegments.length > 0) {
      return extractedSegments
    }

    return hasMeaningfulStringContent(trimmed) ? [trimmed] : []
  }

  if (typeof parsed === 'number' || typeof parsed === 'boolean') {
    return [String(parsed)]
  }

  if (Array.isArray(parsed)) {
    return parsed.flatMap((item) => collectContentSegments(item, depth + 1))
  }

  if (!parsed || typeof parsed !== 'object') {
    return []
  }

  const record = parsed as Record<string, unknown>

  if (isQuizLikeContent(record)) {
    return []
  }

  if (
    typeof record.character === 'string' &&
    typeof record.message === 'string'
  ) {
    const character = record.character.trim()
    const message = record.message.trim()
    if (character && message) {
      return [`${character}: ${message}`]
    }
  }

  if (Array.isArray(record.content_blocks)) {
    return record.content_blocks.flatMap((block) =>
      collectContentSegments(block, depth + 1)
    )
  }

  if (Array.isArray(record.scenes)) {
    return [
      ...collectContentSegments(record.introduction, depth + 1),
      ...record.scenes.flatMap((scene) =>
        collectContentSegments(scene, depth + 1)
      ),
      ...collectContentSegments(record.conclusion, depth + 1),
      ...collectContentSegments(record.reflection_prompt, depth + 1),
    ]
  }

  if (
    record.type === 'html' &&
    typeof record.content === 'string' &&
    record.content.trim()
  ) {
    const title = typeof record.title === 'string' ? record.title.trim() : ''
    return title
      ? [`<h3>${escapeHtml(title)}</h3>${record.content}`]
      : [record.content]
  }

  const prioritizedKeys = [
    'title',
    'subtitle',
    'heading',
    'introduction',
    'instructions',
    'text',
    'content',
    'body',
    'description',
    'prompt',
    'question',
    'message',
    'children',
  ]

  const prioritizedSegments = prioritizedKeys.flatMap((key) =>
    collectContentSegments(record[key], depth + 1)
  )

  if (prioritizedSegments.length > 0) {
    return prioritizedSegments
  }

  return collectLeafText(record, depth)
}

export function extractDisplayContent(value: unknown): string | null {
  const segments = collectContentSegments(value)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)

  if (segments.length === 0) {
    return null
  }

  const hasHtml = segments.some(looksLikeHtml)
  if (!hasHtml) {
    return segments.join('\n\n')
  }

  return segments
    .map((segment) =>
      looksLikeHtml(segment) ? segment : `<p>${escapeHtml(segment)}</p>`
    )
    .join('')
}

export function normalizeImportedActivityContent(
  activityType: string | null | undefined,
  rawContent: unknown
): string {
  if (activityType === 'quiz') {
    return typeof rawContent === 'string'
      ? rawContent
      : JSON.stringify(rawContent ?? {})
  }

  if (activityType === 'lia_script' || activityType === 'ai_chat') {
    return typeof rawContent === 'string'
      ? rawContent
      : JSON.stringify(rawContent ?? {})
  }

  const displayContent = extractDisplayContent(rawContent)
  if (displayContent) {
    return displayContent
  }

  if (typeof rawContent === 'string') {
    const trimmed = rawContent.trim()
    return hasMeaningfulStringContent(trimmed) && !JSON_LIKE_PATTERN.test(trimmed)
      ? rawContent
      : ''
  }

  return ''
}

export function normalizeImportedMaterialContent(rawContent: unknown): unknown {
  const parsed = deepParseJsonValue(rawContent)
  if (parsed === null || parsed === undefined) {
    return null
  }

  if (typeof parsed === 'string') {
    const trimmed = parsed.trim()
    return hasMeaningfulStringContent(trimmed) && !JSON_LIKE_PATTERN.test(trimmed)
      ? parsed
      : null
  }

  if (isQuizLikeContent(parsed)) {
    return parsed
  }

  const displayContent = extractDisplayContent(parsed)
  if (displayContent) {
    return displayContent
  }

  return null
}

export function normalizeActivityContentForClient(
  activityType: string | null | undefined,
  rawContent: unknown
): unknown {
  const parsed = deepParseJsonValue(rawContent)

  if (activityType === 'quiz' || activityType === 'ai_chat') {
    return parsed
  }

  const displayContent = extractDisplayContent(parsed)
  if (displayContent) {
    return displayContent
  }

  if (typeof parsed === 'string') {
    const trimmed = parsed.trim()
    return hasMeaningfulStringContent(trimmed) && !JSON_LIKE_PATTERN.test(trimmed)
      ? parsed
      : ''
  }

  return ''
}

export function normalizeMaterialContentForClient(
  materialType: string | null | undefined,
  rawContent: unknown,
  fallbackDescription?: unknown
): unknown {
  const parsed = deepParseJsonValue(rawContent)

  if (materialType === 'quiz') {
    return parsed
  }

  const displayContent =
    extractDisplayContent(parsed) ?? extractDisplayContent(fallbackDescription)

  if (displayContent) {
    return displayContent
  }

  if (typeof parsed === 'string') {
    const trimmed = parsed.trim()
    if (hasMeaningfulStringContent(trimmed) && !JSON_LIKE_PATTERN.test(trimmed)) {
      return parsed
    }
  }

  return fallbackDescription ?? null
}

type LessonActivityLike = Record<string, unknown> & {
  activity_type?: string | null
  activity_content?: unknown
}

type LessonMaterialLike = Record<string, unknown> & {
  material_type?: string | null
  content_data?: unknown
  material_description?: unknown
}

export function normalizeLessonActivityRecord<T extends LessonActivityLike>(
  activity: T
): T {
  return {
    ...activity,
    activity_content: normalizeActivityContentForClient(
      activity.activity_type,
      activity.activity_content
    ),
  }
}

export function normalizeLessonMaterialRecord<T extends LessonMaterialLike>(
  material: T
): T {
  return {
    ...material,
    content_data: normalizeMaterialContentForClient(
      material.material_type,
      material.content_data,
      material.material_description
    ),
    material_description:
      typeof material.material_description === 'string'
        ? material.material_description
        : extractDisplayContent(material.material_description) ??
          material.material_description ??
          null,
  }
}

export function normalizeContentForRenderer(content: unknown): string {
  if (content === null || content === undefined) {
    return ''
  }

  const displayContent = extractDisplayContent(content)
  if (displayContent) {
    return displayContent
  }

  const parsed = deepParseJsonValue(content)
  if (typeof parsed === 'string') {
    const trimmed = parsed.trim()
    return hasMeaningfulStringContent(trimmed) && !JSON_LIKE_PATTERN.test(trimmed)
      ? parsed
      : ''
  }

  return ''
}
