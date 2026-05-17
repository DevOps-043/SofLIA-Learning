import type { jsPDF as JsPdfDocument } from 'jspdf';

export type PdfFontStyle = 'bold' | 'bolditalic' | 'italic' | 'normal';
export type PdfColorMethod = 'draw' | 'fill' | 'text';
export type PdfRgbColor = readonly [number, number, number];

export interface ParsedHtmlItem {
  content?: string;
  style?: string;
  type: 'break' | 'link' | 'text';
  url?: string;
}

export interface WrapPdfTextParams {
  maxWidth: number;
  measureText: (value: string) => number;
  text: string;
}

export interface PdfTextStyle {
  color: PdfRgbColor;
  fontSize: number;
  fontStyle: PdfFontStyle;
  lineHeight: number;
  spacingAfter: number;
  spacingBefore: number;
}

export interface PdfLayoutCursor {
  contentBottom: number;
  contentLeft: number;
  contentTop: number;
  contentWidth: number;
  pageHeight: number;
  pageWidth: number;
  y: number;
}

export interface NotePdfLabels {
  generatedBy: string;
  page: string;
  tags: string;
  untitled: string;
}

export interface NotePdfOptions {
  fileNameDate?: Date;
  generatedAt?: Date;
  labels?: Partial<NotePdfLabels>;
  locale?: string;
}

export type JsPdfDocumentInstance = JsPdfDocument;
