import type {
  Content,
  ContentText,
  TDocumentDefinitions,
} from 'pdfmake/interfaces';
import type { NoteDraft } from '../types';
import {
  type NotePdfContentBlock,
  type NotePdfInlineRun,
  parseNoteHtmlToPdfBlocks,
} from './notes-pdf-content-parser.service';

export interface NotePdfLabels {
  generatedBy: string;
  page: string;
  tags: string;
  untitled: string;
}

export interface BuildNotePdfDefinitionOptions {
  generatedAt?: Date;
  labels: NotePdfLabels;
  locale?: string;
}

const PAGE_MARGINS: [number, number, number, number] = [56, 56, 56, 64];
const SOFLIA_PRIMARY = '#0A2540';
const SOFLIA_ACCENT = '#00D4B3';
const SOFLIA_TEXT = '#1F2937';
const SOFLIA_MUTED = '#6B7280';
const SOFLIA_LIGHT_BORDER = '#E5E7EB';

function formatGeneratedAt(generatedAt: Date, locale: string): string {
  return generatedAt.toLocaleDateString(locale, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function buildInlineText(run: NotePdfInlineRun): ContentText {
  return {
    bold: run.bold,
    color: run.link ? '#2563EB' : SOFLIA_TEXT,
    decoration: run.decoration || (run.link ? 'underline' : undefined),
    italics: run.italics,
    link: run.link,
    text: run.text,
  };
}

function buildTextBlock(
  runs: NotePdfInlineRun[],
  style: string,
  margin: [number, number, number, number]
): ContentText {
  return {
    margin,
    style,
    text: runs.map(buildInlineText),
  };
}

function buildContentBlock(block: NotePdfContentBlock): Content {
  if (block.type === 'heading') {
    return buildTextBlock(
      block.runs,
      `heading${block.level}`,
      block.level === 1 ? [0, 14, 0, 8] : [0, 10, 0, 6]
    );
  }

  if (block.type === 'list') {
    const listItems = block.items.map((runs) => ({
      text: runs.map(buildInlineText),
    }));

    return block.ordered
      ? {
          margin: [0, 4, 0, 10],
          ol: listItems,
          style: 'paragraph',
        }
      : {
          margin: [0, 4, 0, 10],
          style: 'paragraph',
          ul: listItems,
        };
  }

  return buildTextBlock(block.runs, 'paragraph', [0, 0, 0, 9]);
}

function buildTagsSection(tags: string[], labels: NotePdfLabels): Content[] {
  if (tags.length === 0) {
    return [];
  }

  const tagPills: Content[] = tags.map((tag) => ({
    background: '#D8FBF5',
    color: SOFLIA_PRIMARY,
    fontSize: 9,
    margin: [0, 0, 6, 0] as [number, number, number, number],
    text: `  ${tag}  `,
  }));

  return [
    {
      color: SOFLIA_MUTED,
      margin: [0, 0, 0, 6],
      style: 'metaLabel',
      text: labels.tags,
    },
    {
      columnGap: 0,
      columns: tagPills,
      margin: [0, 0, 0, 18],
    },
  ];
}

function buildDivider(): Content {
  return {
    canvas: [
      {
        lineColor: SOFLIA_ACCENT,
        lineWidth: 1,
        type: 'line',
        x1: 0,
        x2: 483,
        y1: 0,
        y2: 0,
      },
    ],
    margin: [0, 4, 0, 18],
  };
}

export function buildNotePdfDefinition(
  noteDraft: NoteDraft,
  options: BuildNotePdfDefinitionOptions
): TDocumentDefinitions {
  const generatedAt = options.generatedAt || new Date();
  const locale = options.locale || 'es-ES';
  const labels = options.labels;
  const title = noteDraft.title.trim() || labels.untitled;
  const generatedAtLabel = `${labels.generatedBy} - ${formatGeneratedAt(
    generatedAt,
    locale
  )}`;
  const bodyBlocks = parseNoteHtmlToPdfBlocks(noteDraft.content).map(
    buildContentBlock
  );

  return {
    content: [
      {
        color: SOFLIA_PRIMARY,
        margin: [0, 0, 0, 8],
        style: 'title',
        text: title,
      },
      {
        color: SOFLIA_MUTED,
        margin: [0, 0, 0, 20],
        style: 'meta',
        text: generatedAtLabel,
      },
      ...buildTagsSection(noteDraft.tags, labels),
      buildDivider(),
      ...bodyBlocks,
    ],
    defaultStyle: {
      color: SOFLIA_TEXT,
      font: 'Roboto',
      fontSize: 11,
      lineHeight: 1.35,
    },
    footer: (currentPage, pageCount) => ({
      columns: [
        {
          color: SOFLIA_MUTED,
          fontSize: 8,
          text: generatedAtLabel,
          width: '*',
        },
        {
          alignment: 'right',
          color: SOFLIA_MUTED,
          fontSize: 8,
          text: `${labels.page} ${currentPage} / ${pageCount}`,
          width: 'auto',
        },
      ],
      margin: [56, 18, 56, 0],
    }),
    info: {
      author: 'SofLIA',
      creator: 'SofLIA',
      producer: 'SofLIA',
      subject: 'SofLIA note export',
      title,
    },
    pageMargins: PAGE_MARGINS,
    pageSize: 'A4',
    styles: {
      heading1: {
        bold: true,
        color: SOFLIA_PRIMARY,
        fontSize: 17,
        lineHeight: 1.2,
      },
      heading2: {
        bold: true,
        color: SOFLIA_PRIMARY,
        fontSize: 14,
        lineHeight: 1.25,
      },
      heading3: {
        bold: true,
        color: SOFLIA_PRIMARY,
        fontSize: 12,
        lineHeight: 1.25,
      },
      meta: {
        fontSize: 9,
        lineHeight: 1.2,
      },
      metaLabel: {
        bold: true,
        fontSize: 10,
      },
      paragraph: {
        fontSize: 11,
        lineHeight: 1.38,
      },
      title: {
        bold: true,
        fontSize: 22,
        lineHeight: 1.15,
      },
    },
    watermark: undefined,
  };
}
