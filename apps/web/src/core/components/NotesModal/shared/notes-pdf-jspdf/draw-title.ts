import { PDF_THEME } from './constants';
import { ensurePageSpace, formatGeneratedAt } from './layout';
import { applyTextStyle } from './styles';
import type { JsPdfDocumentInstance, NotePdfLabels, PdfLayoutCursor, PdfTextStyle } from './types';
import { wrapPdfText } from './text-wrap';

export function drawTitle(
  pdf: JsPdfDocumentInstance,
  cursor: PdfLayoutCursor,
  title: string,
  labels: NotePdfLabels
) {
  const titleStyle: PdfTextStyle = {
    color: PDF_THEME.primary,
    fontSize: 20,
    fontStyle: 'bold',
    lineHeight: 9.6,
    spacingAfter: 4,
    spacingBefore: 0,
  };
  applyTextStyle(pdf, titleStyle);
  wrapPdfText({ maxWidth: cursor.contentWidth, measureText: (value) => pdf.getTextWidth(value), text: title || labels.untitled })
    .forEach((line) => {
      ensurePageSpace(pdf, cursor, titleStyle.lineHeight);
      pdf.text(line, cursor.contentLeft, cursor.y);
      cursor.y += titleStyle.lineHeight;
    });
}

export function drawMetadata(
  pdf: JsPdfDocumentInstance,
  cursor: PdfLayoutCursor,
  labels: NotePdfLabels,
  generatedAt: Date,
  locale: string
) {
  const metaStyle: PdfTextStyle = {
    color: PDF_THEME.muted,
    fontSize: 9,
    fontStyle: 'normal',
    lineHeight: 5,
    spacingAfter: 7,
    spacingBefore: 0,
  };
  applyTextStyle(pdf, metaStyle);
  ensurePageSpace(pdf, cursor, metaStyle.lineHeight + metaStyle.spacingAfter);
  pdf.text(labels.generatedBy + ' - ' + formatGeneratedAt(generatedAt, locale), cursor.contentLeft, cursor.y);
  cursor.y += metaStyle.lineHeight + metaStyle.spacingAfter;
}
