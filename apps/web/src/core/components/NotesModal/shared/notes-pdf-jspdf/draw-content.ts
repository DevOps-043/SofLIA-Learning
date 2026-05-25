import { BODY_STYLE, PDF_THEME } from './constants';
import { parseNoteHtmlToPdfItems } from './html-parser';
import { ensurePageSpace } from './layout';
import { applyTextStyle, resolvePdfTextStyle, setPdfColor } from './styles';
import type { JsPdfDocumentInstance, ParsedHtmlItem, PdfLayoutCursor } from './types';
import { wrapPdfText } from './text-wrap';

export function drawDivider(pdf: JsPdfDocumentInstance, cursor: PdfLayoutCursor) {
  ensurePageSpace(pdf, cursor, 8);
  setPdfColor(pdf, 'draw', PDF_THEME.divider);
  pdf.setLineWidth(0.45);
  pdf.line(cursor.contentLeft, cursor.y, cursor.contentLeft + cursor.contentWidth, cursor.y);
  cursor.y += 8;
}

export function drawContent(
  pdf: JsPdfDocumentInstance,
  cursor: PdfLayoutCursor,
  content: string
) {
  parseNoteHtmlToPdfItems(content).forEach((item) => {
    if (item.type === 'break') {
      cursor.y += 2.5;
      ensurePageSpace(pdf, cursor, BODY_STYLE.lineHeight);
      return;
    }
    drawTextItem(pdf, cursor, item);
  });
}

function drawTextItem(
  pdf: JsPdfDocumentInstance,
  cursor: PdfLayoutCursor,
  item: ParsedHtmlItem
) {
  if (!item.content) return;
  const style = resolvePdfTextStyle(item);
  applyTextStyle(pdf, style);

  if (style.spacingBefore > 0) {
    ensurePageSpace(pdf, cursor, style.spacingBefore + style.lineHeight);
    cursor.y += style.spacingBefore;
  }

  const indent = item.content.startsWith('- ') || /^d+.s/.test(item.content) ? 5 : 0;
  const maxWidth = cursor.contentWidth - indent;
  const lines = wrapPdfText({ maxWidth, measureText: (value) => pdf.getTextWidth(value), text: item.content });

  lines.forEach((line) => {
    ensurePageSpace(pdf, cursor, style.lineHeight);
    applyTextStyle(pdf, style);
    pdf.text(line, cursor.contentLeft + indent, cursor.y);
    if (item.type === 'link' && item.url) {
      pdf.link(cursor.contentLeft + indent, cursor.y - style.lineHeight + 1, Math.min(pdf.getTextWidth(line), maxWidth), style.lineHeight, { url: item.url });
    }
    cursor.y += style.lineHeight;
  });

  cursor.y += style.spacingAfter;
}
