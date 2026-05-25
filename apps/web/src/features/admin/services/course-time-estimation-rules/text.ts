import {
  deepParseJsonValue,
  normalizeContentForRenderer,
} from '@/lib/course-content'
import type { CourseTimeEstimationTarget } from '../courseTimeEstimation.types'
import { extractQuizPlainText } from './quiz'

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizePlainText(value: unknown): string {
  return typeof value === 'string' ? stripHtml(value) : ''
}

export function parsePromptList(rawPrompts: string | null | undefined): string[] {
  if (!rawPrompts) {
    return []
  }

  const parsedPrompts = deepParseJsonValue(rawPrompts)
  if (Array.isArray(parsedPrompts)) {
    return parsedPrompts.map((prompt) => String(prompt).trim()).filter(Boolean)
  }

  return rawPrompts
    .split('\n')
    .map((prompt) => prompt.trim())
    .filter(Boolean)
}

export function getTargetPlainText(
  target: CourseTimeEstimationTarget,
): string {
  const title = normalizePlainText(target.title)
  const description = normalizePlainText(target.description)
  const prompts = parsePromptList(target.aiPrompts).join(' ')

  if (target.targetType === 'quiz') {
    return [title, description, extractQuizPlainText(target.content)]
      .filter(Boolean)
      .join(' ')
      .trim()
  }

  const normalizedContent = normalizeContentForRenderer(target.content)
  return [title, description, normalizePlainText(normalizedContent), prompts]
    .filter(Boolean)
    .join(' ')
    .trim()
}
