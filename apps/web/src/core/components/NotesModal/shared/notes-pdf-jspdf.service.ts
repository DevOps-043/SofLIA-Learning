import type { NoteDraft } from '../types';
import { buildNotePdfFileName } from './notes-modal.utils';

interface ParsedHtmlItem {
  content?: string;
  style?: string;
  type: 'break' | 'link' | 'text';
  url?: string;
}

function parseHtmlToPdfItems(html: string): ParsedHtmlItem[] {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(html, 'text/html');
  const items: ParsedHtmlItem[] = [];

  const processNode = (node: Node, inheritedStyle?: string) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent?.trim();
      if (textContent) {
        items.push({ content: textContent, style: inheritedStyle, type: 'text' });
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    let nextStyle = inheritedStyle;

    if (tagName === 'strong' || tagName === 'b') {
      nextStyle = inheritedStyle ? `${inheritedStyle},bold` : 'bold';
    } else if (tagName === 'em' || tagName === 'i') {
      nextStyle = inheritedStyle ? `${inheritedStyle},italic` : 'italic';
    } else if (tagName === 'u') {
      nextStyle = inheritedStyle ? `${inheritedStyle},underline` : 'underline';
    } else if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
      nextStyle = tagName;
    }

    if (tagName === 'a') {
      items.push({
        content: element.textContent?.trim() || element.getAttribute('href') || '',
        style: inheritedStyle,
        type: 'link',
        url: element.getAttribute('href') || '',
      });
      return;
    }

    if (tagName === 'br') {
      items.push({ type: 'break' });
      return;
    }

    if (tagName === 'p' || tagName === 'div') {
      if (items.length > 0 && items[items.length - 1]?.type !== 'break') {
        items.push({ type: 'break' });
      }
      Array.from(element.childNodes).forEach((childNode) => processNode(childNode, nextStyle));
      items.push({ type: 'break' });
      return;
    }

    if (tagName === 'ul' || tagName === 'ol') {
      if (items.length > 0 && items[items.length - 1]?.type !== 'break') {
        items.push({ type: 'break' });
      }
      Array.from(element.querySelectorAll(':scope > li')).forEach((itemNode, index) => {
        const prefix = tagName === 'ol' ? `${index + 1}. ` : '- ';
        const textContent = itemNode.textContent?.trim();
        if (textContent) {
          items.push({
            content: `${prefix}${textContent}`,
            style: nextStyle,
            type: 'text',
          });
        }
        items.push({ type: 'break' });
      });
      return;
    }

    Array.from(element.childNodes).forEach((childNode) => processNode(childNode, nextStyle));
  };

  Array.from(documentNode.body.childNodes).forEach((childNode) => processNode(childNode));

  return items;
}

function resolvePdfFont(
  style?: string
): { fontSize: number; fontStyle: 'bold' | 'bolditalic' | 'italic' | 'normal' } {
  if (!style) {
    return { fontSize: 12, fontStyle: 'normal' };
  }

  const styles = style.split(',');
  const hasBold =
    styles.includes('bold') ||
    styles.includes('h1') ||
    styles.includes('h2') ||
    styles.includes('h3');
  const hasItalic = styles.includes('italic');

  if (style === 'h1') return { fontSize: 18, fontStyle: 'bold' };
  if (style === 'h2') return { fontSize: 16, fontStyle: 'bold' };
  if (style === 'h3') return { fontSize: 14, fontStyle: 'bold' };
  if (hasBold && hasItalic) return { fontSize: 12, fontStyle: 'bolditalic' };
  if (hasBold) return { fontSize: 12, fontStyle: 'bold' };
  if (hasItalic) return { fontSize: 12, fontStyle: 'italic' };
  return { fontSize: 12, fontStyle: 'normal' };
}

export async function exportNotePdfWithJsPdf({
  content,
  tags,
  title,
}: NoteDraft): Promise<void> {
  if (!content.trim()) {
    alert('La nota debe tener contenido para exportar');
    return;
  }

  const jsPDF = (await import('jspdf')).default;
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 7;
  const titleLineHeight = 10;
  let y = margin;

  const ensurePageSpace = (requiredHeight: number) => {
    if (y + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  const titleLines = pdf.splitTextToSize(title || 'Nota sin titulo', maxWidth);
  titleLines.forEach((line: string) => {
    ensurePageSpace(titleLineHeight);
    pdf.text(line, margin, y);
    y += titleLineHeight;
  });

  y += 2;
  pdf.setDrawColor(59, 130, 246);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  parseHtmlToPdfItems(content).forEach((item) => {
    if (item.type === 'break') {
      y += lineHeight / 2;
      ensurePageSpace(lineHeight);
      return;
    }

    if (!item.content) {
      return;
    }

    const { fontSize, fontStyle } = resolvePdfFont(item.style);
    const lines = pdf.splitTextToSize(item.content, maxWidth);

    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    pdf.setTextColor(item.type === 'link' && item.url ? 59 : 0, item.type === 'link' && item.url ? 130 : 0, item.type === 'link' && item.url ? 246 : 0);

    lines.forEach((line: string) => {
      ensurePageSpace(lineHeight);
      pdf.text(line, margin, y);
      if (item.type === 'link' && item.url) {
        pdf.link(margin, y - 5, pdf.getTextWidth(line), lineHeight, { url: item.url });
      }
      y += lineHeight;
    });
  });

  if (tags.length > 0) {
    y += 10;
    ensurePageSpace(lineHeight * 2);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(107, 114, 128);
    pdf.text('Etiquetas:', margin, y);
    y += lineHeight;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    let tagX = margin;
    tags.forEach((tag) => {
      const tagWidth = pdf.getTextWidth(tag) + 6;
      if (tagX + tagWidth > pageWidth - margin) {
        y += lineHeight;
        ensurePageSpace(lineHeight);
        tagX = margin;
      }
      pdf.setFillColor(59, 130, 246);
      pdf.roundedRect(tagX, y - 4, tagWidth, 6, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.text(tag, tagX + 3, y);
      tagX += tagWidth + 4;
    });

    pdf.setTextColor(0, 0, 0);
    y += lineHeight + 5;
  }

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);
  pdf.text(
    `Generado el ${new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      month: 'long',
      year: 'numeric',
    })}`,
    pageWidth / 2,
    pageHeight - margin - 10,
    { align: 'center' }
  );

  pdf.save(buildNotePdfFileName(title));
}
