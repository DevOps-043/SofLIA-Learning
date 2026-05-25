import { PDF_LAYOUT, PDF_THEME } from './constants';
import { ensurePageSpace } from './layout';
import { applyTextStyle, setPdfColor } from './styles';
import type { JsPdfDocumentInstance, NotePdfLabels, PdfLayoutCursor, PdfTextStyle } from './types';
import { wrapPdfText } from './text-wrap';

export function drawTags(
  pdf: JsPdfDocumentInstance,
  cursor: PdfLayoutCursor,
  tags: string[],
  labels: NotePdfLabels
) {
  if (tags.length === 0) return;

  const labelStyle: PdfTextStyle = {
    color: PDF_THEME.muted,
    fontSize: 10,
    fontStyle: 'bold',
    lineHeight: 5,
    spacingAfter: 0,
    spacingBefore: 0,
  };
  applyTextStyle(pdf, labelStyle);
  ensurePageSpace(pdf, cursor, labelStyle.lineHeight + PDF_LAYOUT.chipHeight);
  pdf.text(labels.tags, cursor.contentLeft, cursor.y);
  cursor.y += labelStyle.lineHeight + PDF_LAYOUT.tagLabelGap;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  let tagX = cursor.contentLeft;

  tags.forEach((rawTag) => {
    const tagLines = wrapPdfText({ maxWidth: PDF_LAYOUT.chipMaxWidth - 7, measureText: (value) => pdf.getTextWidth(value), text: rawTag });
    (tagLines.length > 0 ? tagLines : [rawTag]).forEach((tagText) => {
      const chipWidth = Math.min(pdf.getTextWidth(tagText) + 8, cursor.contentWidth);
      if (tagX + chipWidth > cursor.contentLeft + cursor.contentWidth) {
        tagX = cursor.contentLeft;
        cursor.y += PDF_LAYOUT.chipHeight + PDF_LAYOUT.chipGap;
      }
      ensurePageSpace(pdf, cursor, PDF_LAYOUT.chipHeight + PDF_LAYOUT.chipGap);
      setPdfColor(pdf, 'fill', PDF_THEME.accent);
      pdf.roundedRect(tagX, cursor.y - 4.8, chipWidth, PDF_LAYOUT.chipHeight, 2, 2, 'F');
      setPdfColor(pdf, 'text', PDF_THEME.chipText);
      pdf.text(tagText, tagX + 4, cursor.y);
      tagX += chipWidth + PDF_LAYOUT.chipGap;
    });
  });

  cursor.y += PDF_LAYOUT.chipHeight + 7;
}
