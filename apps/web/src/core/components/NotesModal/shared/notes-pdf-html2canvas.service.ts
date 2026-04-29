import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { NoteDraft } from '../types';
import { buildNotePdfFileName, escapeNoteLinkHtml } from './notes-modal.utils';

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
  if (!content.trim()) {
    throw new Error('La nota debe tener contenido para exportar');
  }

  const element = document.createElement('div');
  element.style.position = 'absolute';
  element.style.left = '-9999px';
  element.style.top = '0';
  element.style.width = '800px';
  element.style.padding = '40px';
  element.style.backgroundColor = 'white';
  element.style.color = '#1f2937';
  element.style.fontFamily = "'Inter', sans-serif";
  element.innerHTML = `
    <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 12px; color: #111827;">
      ${escapeNoteLinkHtml(title || 'Nota sin titulo')}
    </h1>
    ${
      tags.length > 0
        ? `
      <div style="margin-bottom: 14px;">
        <p style="font-weight: 600; color: #6b7280; margin-bottom: 10px; font-size: 12px;">Etiquetas:</p>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${tags
            .map(
              (tag) => `
            <span style="background-color: #f3f4f6; color: #00D4B3; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 500; border: 1px solid #e5e7eb;">
              ${escapeNoteLinkHtml(tag)}
            </span>
          `
            )
            .join('')}
        </div>
      </div>
    `
        : ''
    }
    <div style="border-top: 2px solid #00D4B3; margin: 0 0 20px; padding-top: 18px;"></div>
    <div class="pdf-content" style="line-height: 1.6; font-size: 14px;">
      ${content}
    </div>
    <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 10px;">
      Generado por SofLIA el ${new Date().toLocaleDateString('es-ES')}
    </div>
  `;

  document.body.appendChild(element);

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      logging: false,
      scale: 2,
      useCORS: true,
    });
    const pdf = new jsPDF({
      format: 'a4',
      orientation: 'portrait',
      unit: 'mm',
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const pdfContentWidth = pageWidth - margin * 2;
    const pdfContentHeight = pageHeight - margin * 2;
    const slices = getCanvasPageSlices({
      canvasHeight: canvas.height,
      canvasWidth: canvas.width,
      pdfContentHeight,
      pdfContentWidth,
    });

    slices.forEach((slice, index) => {
      if (index > 0) {
        pdf.addPage();
      }

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = slice.height;
      const pageContext = pageCanvas.getContext('2d');

      if (!pageContext) {
        throw new Error('No se pudo preparar la pagina del PDF');
      }

      pageContext.drawImage(
        canvas,
        0,
        slice.y,
        canvas.width,
        slice.height,
        0,
        0,
        canvas.width,
        slice.height
      );

      const pageImageData = pageCanvas.toDataURL('image/png');
      const sliceHeightInPdfUnits =
        (slice.height * pdfContentWidth) / canvas.width;

      pdf.addImage(
        pageImageData,
        'PNG',
        margin,
        margin,
        pdfContentWidth,
        sliceHeightInPdfUnits
      );
    });
    pdf.save(buildNotePdfFileName(title));
  } finally {
    document.body.removeChild(element);
  }
}
