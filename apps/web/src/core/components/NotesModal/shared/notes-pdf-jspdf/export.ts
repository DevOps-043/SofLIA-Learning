import type { NoteDraft } from '../../types';
import { exportNotePdfWithPdfMake } from '../notes-pdf-pdfmake.service';
import { DEFAULT_LABELS } from './constants';
import { renderNotePdf } from './render-note-pdf';
import type { JsPdfDocumentInstance, NotePdfOptions } from './types';

export async function generateNotePdfWithJsPdf(
  noteDraft: NoteDraft,
  options: NotePdfOptions = {}
): Promise<JsPdfDocumentInstance> {
  if (!noteDraft.content.trim()) {
    throw new Error('La nota debe tener contenido para exportar');
  }

  const JsPdf = (await import('jspdf')).default;
  const pdf = new JsPdf('p', 'mm', 'a4');
  renderNotePdf(pdf, noteDraft, options);
  return pdf;
}

export async function exportNotePdfWithJsPdf(
  noteDraft: NoteDraft,
  options: NotePdfOptions = {}
): Promise<void> {
  await exportNotePdfWithPdfMake(noteDraft, {
    fileNameDate: options.fileNameDate,
    generatedAt: options.generatedAt,
    labels: {
      generatedBy: options.labels?.generatedBy || DEFAULT_LABELS.generatedBy,
      page: options.labels?.page || DEFAULT_LABELS.page,
      tags: options.labels?.tags || DEFAULT_LABELS.tags,
      untitled: options.labels?.untitled || DEFAULT_LABELS.untitled,
    },
    locale: options.locale,
  });
}
