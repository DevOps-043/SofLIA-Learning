import { sanitizeHtml } from './html-sanitizer.core'

export function sanitizeBio(
  bio: string | null | undefined,
  maxLength = 500,
): string {
  return sanitizeHtml(bio, { level: 'basic', maxLength })
}

export function sanitizePost(content: string | null | undefined): string {
  return sanitizeHtml(content, { level: 'rich' })
}

export function sanitizeComment(
  comment: string | null | undefined,
  maxLength = 1000,
): string {
  return sanitizeHtml(comment, { level: 'rich', maxLength })
}

export function sanitizeCourseContent(
  content: string | null | undefined,
): string {
  return sanitizeHtml(content, { level: 'full' })
}

export function sanitizeText(
  text: string | null | undefined,
  maxLength?: number,
): string {
  return sanitizeHtml(text, { level: 'strict', maxLength })
}
