import type { jsPDF as JsPdfDocument } from 'jspdf'
import type { NoteDraft } from '../../types'
import { DEFAULT_LABELS } from './constants'
import { drawContent, drawDivider } from './draw-content'
import { drawFooters } from './draw-footers'
import { drawMetadata, drawTitle } from './draw-title'
import { drawTags } from './draw-tags'
import { createLayoutCursor } from './layout'
import type { NotePdfOptions } from './types'

export function renderNotePdf(
  pdf: JsPdfDocument,
  { content, tags, title }: NoteDraft,
  options: NotePdfOptions,
) {
  const labels = { ...DEFAULT_LABELS, ...options.labels }
  const locale = options.locale || 'es-ES'
  const generatedAt = options.generatedAt || new Date()
  const cursor = createLayoutCursor(pdf)

  drawTitle(pdf, cursor, title, labels)
  drawMetadata(pdf, cursor, labels, generatedAt, locale)
  drawTags(pdf, cursor, tags, labels)
  drawDivider(pdf, cursor)
  drawContent(pdf, cursor, content)
  drawFooters(pdf, labels, generatedAt, locale)
}
