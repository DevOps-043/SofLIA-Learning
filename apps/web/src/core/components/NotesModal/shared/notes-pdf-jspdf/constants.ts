import type { NotePdfLabels, PdfTextStyle } from './types';

export const PDF_THEME = {
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

export const PDF_LAYOUT = {
  chipGap: 4,
  chipHeight: 7,
  chipMaxWidth: 72,
  footerHeight: 16,
  marginBottom: 18,
  marginX: 22,
  marginTop: 24,
  tagLabelGap: 6,
};

export const DEFAULT_LABELS: NotePdfLabels = {
  generatedBy: 'Generado por SofLIA',
  page: 'Pagina',
  tags: 'Etiquetas:',
  untitled: 'Nota sin titulo',
};

export const BODY_STYLE: PdfTextStyle = {
  color: PDF_THEME.text,
  fontSize: 11,
  fontStyle: 'normal',
  lineHeight: 6.2,
  spacingAfter: 2.8,
  spacingBefore: 0,
};

export const PDF_TEXT_STYLES: Record<string, PdfTextStyle> = {
  body: BODY_STYLE,
  h1: { color: PDF_THEME.primary, fontSize: 17, fontStyle: 'bold', lineHeight: 8.6, spacingAfter: 3.8, spacingBefore: 3 },
  h2: { color: PDF_THEME.primary, fontSize: 14.5, fontStyle: 'bold', lineHeight: 7.6, spacingAfter: 3.4, spacingBefore: 2.5 },
  h3: { color: PDF_THEME.primary, fontSize: 12.5, fontStyle: 'bold', lineHeight: 6.8, spacingAfter: 3, spacingBefore: 2 },
  link: { color: PDF_THEME.link, fontSize: 11, fontStyle: 'normal', lineHeight: 6.2, spacingAfter: 2.8, spacingBefore: 0 },
};
