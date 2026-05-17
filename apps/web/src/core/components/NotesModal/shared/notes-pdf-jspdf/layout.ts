import { PDF_LAYOUT } from './constants';
import type { JsPdfDocumentInstance, PdfLayoutCursor } from './types';

export function createLayoutCursor(pdf: JsPdfDocumentInstance): PdfLayoutCursor {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  return {
    contentBottom: pageHeight - PDF_LAYOUT.marginBottom - PDF_LAYOUT.footerHeight,
    contentLeft: PDF_LAYOUT.marginX,
    contentTop: PDF_LAYOUT.marginTop,
    contentWidth: pageWidth - PDF_LAYOUT.marginX * 2,
    pageHeight,
    pageWidth,
    y: PDF_LAYOUT.marginTop,
  };
}

export function shouldAddPdfPage({
  contentBottom,
  requiredHeight,
  y,
}: {
  contentBottom: number;
  requiredHeight: number;
  y: number;
}): boolean {
  return y + requiredHeight > contentBottom;
}

export function ensurePageSpace(
  pdf: JsPdfDocumentInstance,
  cursor: PdfLayoutCursor,
  requiredHeight: number
) {
  if (!shouldAddPdfPage({ contentBottom: cursor.contentBottom, requiredHeight, y: cursor.y })) return;
  pdf.addPage();
  cursor.y = cursor.contentTop;
}

export function formatGeneratedAt(generatedAt: Date, locale: string): string {
  return generatedAt.toLocaleDateString(locale, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
