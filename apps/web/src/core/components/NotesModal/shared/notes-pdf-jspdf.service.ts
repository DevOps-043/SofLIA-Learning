import type { jsPDF as JsPdfDocument } from 'jspdf';
import type { NoteDraft } from '../types';
import { normalizeNoteLinkUrl } from './notes-modal.utils';
import { exportNotePdfWithPdfMake } from './notes-pdf-pdfmake.service';

type PdfFontStyle = 'bold' | 'bolditalic' | 'italic' | 'normal';
type PdfRgbColor = readonly [number, number, number];

interface ParsedHtmlItem {
  content?: string;
  style?: string;
  type: 'break' | 'link' | 'text';
  url?: string;
}

interface WrapPdfTextParams {
  maxWidth: number;
  measureText: (value: string) => number;
  text: string;
}

interface PdfTextStyle {
  color: PdfRgbColor;
  fontSize: number;
  fontStyle: PdfFontStyle;
  lineHeight: number;
  spacingAfter: number;
  spacingBefore: number;
}

interface PdfLayoutCursor {
  contentBottom: number;
  contentLeft: number;
  contentTop: number;
  contentWidth: number;
  pageHeight: number;
  pageWidth: number;
  y: number;
}

interface NotePdfLabels {
  generatedBy: string;
  page: string;
  tags: string;
  untitled: string;
}

interface NotePdfOptions {
  fileNameDate?: Date;
  generatedAt?: Date;
  labels?: Partial<NotePdfLabels>;
  locale?: string;
}

const PDF_THEME = {
  accent: [0, 212, 179] as const,
  chipText: [10, 37, 64] as const,
  divider: [0, 212, 179] as const,
  link: [37, 99, 235] as const,
  muted: [107, 114, 128] as const,
  primary: [10, 37, 64] as const,
  subtle: [229, 231, 235] as const,
  text: [31, 41, 55] as const,
  white: [255, 255, 255] as const,
};

const PDF_LAYOUT = {
  chipGap: 4,
  chipHeight: 7,
  chipMaxWidth: 72,
  footerHeight: 16,
  marginBottom: 18,
  marginX: 22,
  marginTop: 24,
  tagLabelGap: 6,
};

const DEFAULT_LABELS: NotePdfLabels = {
  generatedBy: 'Generado por SofLIA',
  page: 'Pagina',
  tags: 'Etiquetas:',
  untitled: 'Nota sin titulo',
};

const BODY_STYLE: PdfTextStyle = {
  color: PDF_THEME.text,
  fontSize: 11,
  fontStyle: 'normal',
  lineHeight: 6.2,
  spacingAfter: 2.8,
  spacingBefore: 0,
};

const PDF_TEXT_STYLES: Record<string, PdfTextStyle> = {
  body: BODY_STYLE,
  h1: {
    color: PDF_THEME.primary,
    fontSize: 17,
    fontStyle: 'bold',
    lineHeight: 8.6,
    spacingAfter: 3.8,
    spacingBefore: 3,
  },
  h2: {
    color: PDF_THEME.primary,
    fontSize: 14.5,
    fontStyle: 'bold',
    lineHeight: 7.6,
    spacingAfter: 3.4,
    spacingBefore: 2.5,
  },
  h3: {
    color: PDF_THEME.primary,
    fontSize: 12.5,
    fontStyle: 'bold',
    lineHeight: 6.8,
    spacingAfter: 3,
    spacingBefore: 2,
  },
  link: {
    color: PDF_THEME.link,
    fontSize: 11,
    fontStyle: 'normal',
    lineHeight: 6.2,
    spacingAfter: 2.8,
    spacingBefore: 0,
  },
};

function splitOversizedToken(
  token: string,
  maxWidth: number,
  measureText: (value: string) => number
): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  Array.from(token).forEach((character) => {
    const candidate = `${currentChunk}${character}`;

    if (currentChunk && measureText(candidate) > maxWidth) {
      chunks.push(currentChunk);
      currentChunk = character;
      return;
    }

    currentChunk = candidate;
  });

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

export function wrapPdfText({
  maxWidth,
  measureText,
  text,
}: WrapPdfTextParams): string[] {
  const normalizedText = text
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();

  if (!normalizedText) {
    return [];
  }

  return normalizedText.split(/\r?\n/).flatMap((rawParagraph) => {
    const paragraph = rawParagraph.trim();

    if (!paragraph) {
      return [''];
    }

    const lines: string[] = [];
    let currentLine = '';

    paragraph.split(/\s+/).forEach((word) => {
      const wordParts =
        measureText(word) > maxWidth
          ? splitOversizedToken(word, maxWidth, measureText)
          : [word];

      wordParts.forEach((wordPart) => {
        const candidate = currentLine ? `${currentLine} ${wordPart}` : wordPart;

        if (currentLine && measureText(candidate) > maxWidth) {
          lines.push(currentLine);
          currentLine = wordPart;
          return;
        }

        currentLine = candidate;
      });
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  });
}

function normalizeTextSegment(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();
}

function splitReadableTextSegments(value: string): string[] {
  const normalizedValue = value
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{2,}/g, '\n\n')
    .replace(/\s+(?=\[\d{2}:\d{2}\])/g, '\n\n');

  return normalizedValue
    .split(/\n{2,}/)
    .map(normalizeTextSegment)
    .filter(Boolean);
}

export function parseNoteHtmlToPdfItems(html: string): ParsedHtmlItem[] {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(html, 'text/html');
  const items: ParsedHtmlItem[] = [];

  const pushBreak = () => {
    if (items.length > 0 && items[items.length - 1]?.type !== 'break') {
      items.push({ type: 'break' });
    }
  };

  const processNode = (node: Node, inheritedStyle?: string) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const textSegments = splitReadableTextSegments(node.textContent || '');

      textSegments.forEach((textContent, index) => {
        if (index > 0) {
          pushBreak();
        }

        items.push({ content: textContent, style: inheritedStyle, type: 'text' });
      });
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

    if (tagName === 'script' || tagName === 'style') {
      return;
    }

    if (tagName === 'a') {
      const normalizedUrl = normalizeNoteLinkUrl(element.getAttribute('href') || '');
      const linkText = normalizeTextSegment(
        element.textContent || normalizedUrl || ''
      );

      if (linkText) {
        items.push({
          content: linkText,
          style: inheritedStyle,
          type: 'link',
          url: normalizedUrl || undefined,
        });
      }
      return;
    }

    if (tagName === 'br') {
      items.push({ type: 'break' });
      return;
    }

    if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
      pushBreak();
      Array.from(element.childNodes).forEach((childNode) =>
        processNode(childNode, nextStyle)
      );
      items.push({ type: 'break' });
      return;
    }

    if (tagName === 'p' || tagName === 'div') {
      pushBreak();
      Array.from(element.childNodes).forEach((childNode) =>
        processNode(childNode, nextStyle)
      );
      items.push({ type: 'break' });
      return;
    }

    if (tagName === 'ul' || tagName === 'ol') {
      pushBreak();
      Array.from(element.querySelectorAll(':scope > li')).forEach(
        (itemNode, index) => {
          const prefix = tagName === 'ol' ? `${index + 1}. ` : '- ';
          const textContent = normalizeTextSegment(itemNode.textContent || '');

          if (textContent) {
            items.push({
              content: `${prefix}${textContent}`,
              style: nextStyle,
              type: 'text',
            });
          }
          items.push({ type: 'break' });
        }
      );
      return;
    }

    Array.from(element.childNodes).forEach((childNode) =>
      processNode(childNode, nextStyle)
    );
  };

  Array.from(documentNode.body.childNodes).forEach((childNode) =>
    processNode(childNode)
  );

  return items;
}

function resolvePdfTextStyle(item: ParsedHtmlItem): PdfTextStyle {
  if (item.type === 'link' && item.url) {
    return PDF_TEXT_STYLES.link;
  }

  if (!item.style) {
    return PDF_TEXT_STYLES.body;
  }

  const styles = item.style.split(',');
  const hasBold =
    styles.includes('bold') ||
    styles.includes('h1') ||
    styles.includes('h2') ||
    styles.includes('h3');
  const hasItalic = styles.includes('italic');

  if (item.style === 'h1') return PDF_TEXT_STYLES.h1;
  if (item.style === 'h2') return PDF_TEXT_STYLES.h2;
  if (item.style === 'h3') return PDF_TEXT_STYLES.h3;
  if (hasBold && hasItalic) {
    return { ...BODY_STYLE, fontStyle: 'bolditalic' };
  }
  if (hasBold) {
    return { ...BODY_STYLE, fontStyle: 'bold' };
  }
  if (hasItalic) {
    return { ...BODY_STYLE, fontStyle: 'italic' };
  }

  return PDF_TEXT_STYLES.body;
}

function setPdfColor(
  pdf: JsPdfDocument,
  method: 'draw' | 'fill' | 'text',
  color: PdfRgbColor
) {
  if (method === 'draw') {
    pdf.setDrawColor(color[0], color[1], color[2]);
    return;
  }

  if (method === 'fill') {
    pdf.setFillColor(color[0], color[1], color[2]);
    return;
  }

  pdf.setTextColor(color[0], color[1], color[2]);
}

function applyTextStyle(pdf: JsPdfDocument, style: PdfTextStyle) {
  pdf.setFontSize(style.fontSize);
  pdf.setFont('helvetica', style.fontStyle);
  setPdfColor(pdf, 'text', style.color);
}

function createLayoutCursor(pdf: JsPdfDocument): PdfLayoutCursor {
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

function ensurePageSpace(
  pdf: JsPdfDocument,
  cursor: PdfLayoutCursor,
  requiredHeight: number
) {
  if (!shouldAddPdfPage({ contentBottom: cursor.contentBottom, requiredHeight, y: cursor.y })) {
    return;
  }

  pdf.addPage();
  cursor.y = cursor.contentTop;
}

function formatGeneratedAt(generatedAt: Date, locale: string): string {
  return generatedAt.toLocaleDateString(locale, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function drawTitle(
  pdf: JsPdfDocument,
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

  const titleLines = wrapPdfText({
    maxWidth: cursor.contentWidth,
    measureText: (value) => pdf.getTextWidth(value),
    text: title || labels.untitled,
  });

  titleLines.forEach((line) => {
    ensurePageSpace(pdf, cursor, titleStyle.lineHeight);
    pdf.text(line, cursor.contentLeft, cursor.y);
    cursor.y += titleStyle.lineHeight;
  });
}

function drawMetadata(
  pdf: JsPdfDocument,
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
  pdf.text(
    `${labels.generatedBy} - ${formatGeneratedAt(generatedAt, locale)}`,
    cursor.contentLeft,
    cursor.y
  );
  cursor.y += metaStyle.lineHeight + metaStyle.spacingAfter;
}

function drawTags(
  pdf: JsPdfDocument,
  cursor: PdfLayoutCursor,
  tags: string[],
  labels: NotePdfLabels
) {
  if (tags.length === 0) {
    return;
  }

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
    const tagLines = wrapPdfText({
      maxWidth: PDF_LAYOUT.chipMaxWidth - 7,
      measureText: (value) => pdf.getTextWidth(value),
      text: rawTag,
    });

    (tagLines.length > 0 ? tagLines : [rawTag]).forEach((tagText) => {
      const chipWidth = Math.min(
        pdf.getTextWidth(tagText) + 8,
        cursor.contentWidth
      );

      if (tagX + chipWidth > cursor.contentLeft + cursor.contentWidth) {
        tagX = cursor.contentLeft;
        cursor.y += PDF_LAYOUT.chipHeight + PDF_LAYOUT.chipGap;
      }

      ensurePageSpace(pdf, cursor, PDF_LAYOUT.chipHeight + PDF_LAYOUT.chipGap);
      setPdfColor(pdf, 'fill', PDF_THEME.accent);
      pdf.roundedRect(
        tagX,
        cursor.y - 4.8,
        chipWidth,
        PDF_LAYOUT.chipHeight,
        2,
        2,
        'F'
      );
      setPdfColor(pdf, 'text', PDF_THEME.chipText);
      pdf.text(tagText, tagX + 4, cursor.y);
      tagX += chipWidth + PDF_LAYOUT.chipGap;
    });
  });

  cursor.y += PDF_LAYOUT.chipHeight + 7;
}

function drawDivider(pdf: JsPdfDocument, cursor: PdfLayoutCursor) {
  ensurePageSpace(pdf, cursor, 8);
  setPdfColor(pdf, 'draw', PDF_THEME.divider);
  pdf.setLineWidth(0.45);
  pdf.line(
    cursor.contentLeft,
    cursor.y,
    cursor.contentLeft + cursor.contentWidth,
    cursor.y
  );
  cursor.y += 8;
}

function drawTextItem(
  pdf: JsPdfDocument,
  cursor: PdfLayoutCursor,
  item: ParsedHtmlItem
) {
  if (!item.content) {
    return;
  }

  const style = resolvePdfTextStyle(item);
  applyTextStyle(pdf, style);

  if (style.spacingBefore > 0) {
    ensurePageSpace(pdf, cursor, style.spacingBefore + style.lineHeight);
    cursor.y += style.spacingBefore;
  }

  const indent = item.content.startsWith('- ') || /^\d+\.\s/.test(item.content) ? 5 : 0;
  const maxWidth = cursor.contentWidth - indent;
  const lines = wrapPdfText({
    maxWidth,
    measureText: (value) => pdf.getTextWidth(value),
    text: item.content,
  });

  lines.forEach((line) => {
    ensurePageSpace(pdf, cursor, style.lineHeight);
    applyTextStyle(pdf, style);
    pdf.text(line, cursor.contentLeft + indent, cursor.y);

    if (item.type === 'link' && item.url) {
      pdf.link(
        cursor.contentLeft + indent,
        cursor.y - style.lineHeight + 1,
        Math.min(pdf.getTextWidth(line), maxWidth),
        style.lineHeight,
        { url: item.url }
      );
    }

    cursor.y += style.lineHeight;
  });

  cursor.y += style.spacingAfter;
}

function drawContent(
  pdf: JsPdfDocument,
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

function drawFooters(
  pdf: JsPdfDocument,
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
    pdf.text(
      `${labels.generatedBy} - ${formatGeneratedAt(generatedAt, locale)}`,
      PDF_LAYOUT.marginX,
      footerTextY
    );
    pdf.text(
      `${labels.page} ${pageNumber} / ${pageCount}`,
      pageWidth - PDF_LAYOUT.marginX,
      footerTextY,
      { align: 'right' }
    );
  }
}

function renderNotePdf(
  pdf: JsPdfDocument,
  { content, tags, title }: NoteDraft,
  options: NotePdfOptions
) {
  const labels = { ...DEFAULT_LABELS, ...options.labels };
  const locale = options.locale || 'es-ES';
  const generatedAt = options.generatedAt || new Date();
  const cursor = createLayoutCursor(pdf);

  drawTitle(pdf, cursor, title, labels);
  drawMetadata(pdf, cursor, labels, generatedAt, locale);
  drawTags(pdf, cursor, tags, labels);
  drawDivider(pdf, cursor);
  drawContent(pdf, cursor, content);
  drawFooters(pdf, labels, generatedAt, locale);
}

export async function generateNotePdfWithJsPdf(
  noteDraft: NoteDraft,
  options: NotePdfOptions = {}
): Promise<JsPdfDocument> {
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
  await exportNotePdfWithPdfMake(
    noteDraft,
    {
      fileNameDate: options.fileNameDate,
      generatedAt: options.generatedAt,
      labels: {
        generatedBy: options.labels?.generatedBy || DEFAULT_LABELS.generatedBy,
        page: options.labels?.page || DEFAULT_LABELS.page,
        tags: options.labels?.tags || DEFAULT_LABELS.tags,
        untitled: options.labels?.untitled || DEFAULT_LABELS.untitled,
      },
      locale: options.locale,
    }
  );
}
