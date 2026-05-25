import { PDF_LAYOUT, PDF_THEME } from './constants';
import { formatGeneratedAt } from './layout';
import { setPdfColor } from './styles';
import type { JsPdfDocumentInstance, NotePdfLabels } from './types';

export function drawFooters(
  pdf: JsPdfDocumentInstance,
  labels: NotePdfLabels,
  generatedAt: Date,
  locale: string
) {
  const pageCount = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const footerY = pageHeight - 13;
  const footerTextY = pageHeight - 8;

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    pdf.setPage(pageNumber);
    setPdfColor(pdf, 'draw', PDF_THEME.subtle);
    pdf.setLineWidth(0.25);
    pdf.line(PDF_LAYOUT.marginX, footerY, pageWidth - PDF_LAYOUT.marginX, footerY);
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    setPdfColor(pdf, 'text', PDF_THEME.muted);
    pdf.text(labels.generatedBy + ' - ' + formatGeneratedAt(generatedAt, locale), PDF_LAYOUT.marginX, footerTextY);
    pdf.text(labels.page + ' ' + pageNumber + ' / ' + pageCount, pageWidth - PDF_LAYOUT.marginX, footerTextY, { align: 'right' });
  }
}
