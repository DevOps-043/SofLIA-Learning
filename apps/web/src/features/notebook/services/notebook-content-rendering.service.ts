import { sanitizeHtml } from '@/lib/sanitize/html-sanitizer'
import { convertNoteMarkdownToHtml } from '@/core/components/NotesModal/shared/notes-markdown-to-html.service'

const NOTEBOOK_RICH_TEXT_MAX_LENGTH = 100_000
const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i
const MARKDOWN_PATTERN =
  /(^|\s)(#{2,3}\s+|\*\*[^*\n]+\*\*|(?<!\*)\*[^*\n]+\*(?!\*)|`[^`\n]+`|\[[^\]\n]+\]\([^)]+\)|^\s*[-*]\s+|^\s*\d+\.\s+)/m

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

export function getNotebookPlainText(content: string): string {
  const safeHtml = sanitizeNotebookRichContent(content)

  if (typeof window !== 'undefined') {
    const parser = new DOMParser()
    const documentNode = parser.parseFromString(safeHtml, 'text/html')
    return (documentNode.body.textContent || '').replace(/\s+/g, ' ').trim()
  }

  return safeHtml.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}
