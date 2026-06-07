import { sanitizeHtml } from '@/lib/sanitize/html-sanitizer'
import { convertNoteMarkdownToHtml } from '@/core/components/NotesModal/shared/notes-markdown-to-html.service'

const NOTEBOOK_RICH_TEXT_MAX_LENGTH = 100_000
const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i
const MARKDOWN_PATTERN =
  /(^|\s)(#{2,3}\s+|\*\*[^*\n]+\*\*|(?<!\*)\*[^*\n]+\*(?!\*)|`[^`\n]+`|\[[^\]\n]+\]\([^)]+\)|^\s*[-*]\s+|^\s*\d+\.\s+)/m
const BLOCK_CLOSE_PATTERN = /<\/(?:p|div|section|article|li|h[1-6]|blockquote|tr)>/gi
const LINE_BREAK_PATTERN = /<br\s*\/?>/gi
const HTML_ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&apos;': "'",
  '&gt;': '>',
  '&lt;': '<',
  '&nbsp;': ' ',
  '&quot;': '"',
}

function normalizeNotebookContentToHtml(content: string): string {
  if (!content.trim()) return ''
  if (HTML_TAG_PATTERN.test(content)) return content
  if (MARKDOWN_PATTERN.test(content)) return convertNoteMarkdownToHtml(content)
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

export function sanitizeNotebookRichContent(content: string): string {
  return sanitizeHtml(normalizeNotebookContentToHtml(content), {
    level: 'rich',
    maxLength: NOTEBOOK_RICH_TEXT_MAX_LENGTH,
  })
}

function decodeNotebookEntities(text: string): string {
  return text.replace(/&(amp|apos|gt|lt|nbsp|quot);/g, (entity) => HTML_ENTITY_MAP[entity] ?? entity)
}

function htmlToEditableText(html: string): string {
  return html
    .replace(LINE_BREAK_PATTERN, '\n')
    .replace(BLOCK_CLOSE_PATTERN, '\n')
    .replace(/<[^>]*>/g, '')
}

export function getNotebookPlainText(content: string): string {
  const safeHtml = sanitizeNotebookRichContent(content)

  if (typeof window !== 'undefined') {
    const parser = new DOMParser()
    const documentNode = parser.parseFromString(safeHtml, 'text/html')
    return decodeNotebookEntities(documentNode.body.textContent || '').replace(/\s+/g, ' ').trim()
  }

  return decodeNotebookEntities(htmlToEditableText(safeHtml)).replace(/\s+/g, ' ').trim()
}

export function getNotebookEditableText(content: string): string {
  if (!HTML_TAG_PATTERN.test(content)) {
    return content.trim()
  }

  const safeHtml = sanitizeNotebookRichContent(content)
  const editableText = htmlToEditableText(safeHtml)

  return decodeNotebookEntities(editableText)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}
