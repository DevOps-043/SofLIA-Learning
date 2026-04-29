import type { NoteDraft } from '../types';
import { exportNotePdfWithPdfMake } from './notes-pdf-pdfmake.service';

interface CanvasPageSlice {
  height: number;
  y: number;
}

export function getCanvasPageSlices({
  canvasHeight,
  canvasWidth,
  pdfContentHeight,
  pdfContentWidth,
}: {
  canvasHeight: number;
  canvasWidth: number;
  pdfContentHeight: number;
  pdfContentWidth: number;
}): CanvasPageSlice[] {
  const pixelsPerPdfUnit = canvasWidth / pdfContentWidth;
  const pageHeightInPixels = Math.floor(pdfContentHeight * pixelsPerPdfUnit);
  const slices: CanvasPageSlice[] = [];

  if (pageHeightInPixels <= 0) {
    return [{ height: canvasHeight, y: 0 }];
  }

  for (let y = 0; y < canvasHeight; y += pageHeightInPixels) {
    slices.push({
      height: Math.min(pageHeightInPixels, canvasHeight - y),
      y,
    });
  }

  return slices;
}

export async function exportNotePdfWithCanvas({
  content,
  tags,
  title,
}: NoteDraft): Promise<void> {
  await exportNotePdfWithPdfMake(
    { content, tags, title },
    {
      labels: {
        generatedBy: 'Generado por SofLIA',
        page: 'Pagina',
        tags: 'Etiquetas:',
        untitled: 'Nota sin titulo',
      },
      locale: 'es',
    }
  );
}
