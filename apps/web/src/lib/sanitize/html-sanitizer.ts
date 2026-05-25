'use client'

export { getDOMPurify } from './html-sanitizer.dompurify'
export {
  containsDangerousHtml,
  getSanitizationStats,
} from './html-sanitizer.stats'
export { sanitizeHtml } from './html-sanitizer.core'
export {
  sanitizeBio,
  sanitizeComment,
  sanitizeCourseContent,
  sanitizePost,
  sanitizeText,
} from './html-sanitizer.shortcuts'
export type {
  SanitizeOptions,
  SanitizationLevel,
  SanitizerConfig,
} from './html-sanitizer.types'
