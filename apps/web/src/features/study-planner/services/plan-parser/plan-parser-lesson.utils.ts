import type { StudyPlannerScheduledLesson } from '../../types/planner-schedule.types'
import { LESSON_LIST_BULLET_PATTERN } from './plan-parser.constants'
import {
  isNonLessonLine,
  normalizeComparableText,
} from './plan-parser-text.utils'

const LESSON_PATTERNS = [
  new RegExp(`^${LESSON_LIST_BULLET_PATTERN}leccion\\s+(\\d+(?:\\.\\d+)*)[:.\\-]?\\s*(.+)$`, 'i'),
  new RegExp(`^${LESSON_LIST_BULLET_PATTERN}(\\d+(?:\\.\\d+)*)[:.\\-]\\s*(.+)$`, 'i'),
  new RegExp(`^${LESSON_LIST_BULLET_PATTERN}(.+)$`, 'i'),
  /^(.+?)(?:\(|\[|-)?\s*(\d+)\s*(?:min|minuto|minutos)(?:\)|\])?\s*$/i,
]

export function extractLessonFromLine(rawLine: string): StudyPlannerScheduledLesson | null {
  const normalized = normalizeComparableText(rawLine)
  if (!normalized || isNonLessonLine(normalized)) {
    return null
  }

  for (const pattern of LESSON_PATTERNS) {
    const match = rawLine.trim().match(pattern)
    if (!match) {
      continue
    }

    const parsedLesson = parseLessonMatch(pattern, match)

    if (!isValidLessonTitle(parsedLesson.lessonTitle)) {
      return null
    }

    return {
      courseTitle: 'Curso',
      ...parsedLesson,
    }
  }

  return null
}

function parseLessonMatch(pattern: RegExp, match: RegExpMatchArray) {
  const isNonNumericPattern = pattern === LESSON_PATTERNS[2] || pattern === LESSON_PATTERNS[3]
  const lessonOrderIndex = isNonNumericPattern ? 0 : Number.parseInt(match[1], 10) || 0
  let lessonTitle = (isNonNumericPattern ? match[1] : match[2]).trim()
  let durationMinutes = pattern === LESSON_PATTERNS[3] ? Number.parseInt(match[2], 10) : 0

  if (pattern !== LESSON_PATTERNS[3]) {
    const durationMatch = lessonTitle.match(/(?:\(|\[|-)?\s*(\d+)\s*(?:min|minuto|minutos)(?:\)|\])?/i)
    if (durationMatch) {
      durationMinutes = Number.parseInt(durationMatch[1], 10)
      lessonTitle = lessonTitle.replace(durationMatch[0], '').trim()
    }
  }

  return { lessonOrderIndex, lessonTitle, durationMinutes }
}

function isValidLessonTitle(lessonTitle: string): boolean {
  const comparableTitle = normalizeComparableText(lessonTitle)
  return Boolean(comparableTitle && comparableTitle.length > 3) &&
    !/^leccion\s+\d+(?:\.\d+)?[:.\-]?\s*$/.test(comparableTitle)
}
