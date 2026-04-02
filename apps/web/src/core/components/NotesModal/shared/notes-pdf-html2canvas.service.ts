import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { NoteDraft } from '../types';
import { buildNotePdfFileName } from './notes-modal.utils';

export async function exportNotePdfWithCanvas({
  content,
  tags,
  title,
}: NoteDraft): Promise<void> {
  if (!content.trim()) {
    alert('La nota debe tener contenido para exportar');
    return;
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
    <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 20px; color: #111827; border-bottom: 2px solid #00D4B3; padding-bottom: 10px;">
      ${title || 'Nota sin titulo'}
    </h1>
    <div class="pdf-content" style="line-height: 1.6; font-size: 14px;">
      ${content}
    </div>
    ${
      tags.length > 0
        ? `
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
        <p style="font-weight: 600; color: #6b7280; margin-bottom: 10px; font-size: 12px;">Etiquetas:</p>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${tags
            .map(
              (tag) => `
            <span style="background-color: #f3f4f6; color: #00D4B3; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 500; border: 1px solid #e5e7eb;">
              ${tag}
            </span>
          `
            )
            .join('')}
        </div>
      </div>
    `
        : ''
    }
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
    const imageData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      format: 'a4',
      orientation: 'portrait',
      unit: 'mm',
    });
    const imageProps = pdf.getImageProperties(imageData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imageProps.height * pdfWidth) / imageProps.width;

    pdf.addImage(imageData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(buildNotePdfFileName(title));
  } finally {
    document.body.removeChild(element);
  }
}
