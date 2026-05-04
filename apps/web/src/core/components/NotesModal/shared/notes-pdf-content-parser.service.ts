import { normalizeNoteLinkUrl } from './notes-modal.utils';

export interface NotePdfInlineRun {
  bold?: boolean;
  italics?: boolean;
  link?: string;
  text: string;
  decoration?: 'underline';
}

export type NotePdfContentBlock =
  | {
      level: 1 | 2 | 3;
      runs: NotePdfInlineRun[];
      type: 'heading';
    }
  | {
      runs: NotePdfInlineRun[];
      type: 'paragraph';
    }
  | {
      items: NotePdfInlineRun[][];
      ordered: boolean;
      type: 'list';
    };

interface InlineStyleState {
  bold?: boolean;
  italics?: boolean;
  link?: string;
  decoration?: 'underline';
}

function normalizeTextSegment(value: string): string {
  // Collapse tabs, newlines, and spaces into a single space.
  // DO NOT use .trim() here, as it removes spaces between inline elements (e.g., text and bold nodes).
  return value.replace(/\u00a0/g, ' ').replace(/[ \t\r\n]+/g, ' ');
}

export function splitReadableNoteText(value: string): string[] {
  const normalizedValue = value
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{2,}/g, '\n\n')
    .replace(/\s+(?=\[\d{2}:\d{2}\])/g, '\n\n');

  return normalizedValue
    .split(/\n{2,}/)
    .map(normalizeTextSegment)
    .filter((text) => text.length > 0);
}

function appendInlineSegments(
  currentSegments: NotePdfInlineRun[][],
  nextSegments: NotePdfInlineRun[][]
): NotePdfInlineRun[][] {
  if (nextSegments.length === 0) {
    return currentSegments;
  }

  const mergedSegments = [...currentSegments];
  nextSegments.forEach((segment, index) => {
    if (index === 0) {
      mergedSegments[mergedSegments.length - 1] = [
        ...mergedSegments[mergedSegments.length - 1],
        ...segment,
      ];
      return;
    }

    mergedSegments.push(segment);
  });

  return mergedSegments;
}

function collectInlineSegments(
  node: Node,
  inheritedStyle: InlineStyleState = {}
): NotePdfInlineRun[][] {
  if (node.nodeType === Node.TEXT_NODE) {
    return splitReadableNoteText(node.textContent || '').map((text) => [
      {
        ...inheritedStyle,
        text,
      },
    ]);
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return [];
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'script' || tagName === 'style') {
    return [];
  }

  if (tagName === 'br') {
    return [[], []];
  }

  let nextStyle = inheritedStyle;

  // Bold and italic are intentionally NOT applied here.
  // The <strong>/<em> tags are stripped upstream in parseNoteHtmlToPdfBlocks
  // to prevent pdfmake from splitting text runs and eating inter-word spaces.
  if (tagName === 'u') {
    nextStyle = { ...nextStyle, decoration: 'underline' };
  } else if (tagName === 'a') {
    const normalizedUrl = normalizeNoteLinkUrl(element.getAttribute('href') || '');
    nextStyle = normalizedUrl ? { ...nextStyle, link: normalizedUrl } : nextStyle;
  }

  return Array.from(element.childNodes).reduce<NotePdfInlineRun[][]>(
    (segments, childNode) =>
      appendInlineSegments(segments, collectInlineSegments(childNode, nextStyle)),
    [[]]
  );
}

function mergeRuns(runs: NotePdfInlineRun[]): NotePdfInlineRun[] {
  if (runs.length <= 1) return runs;
  const merged: NotePdfInlineRun[] = [];
  let current = runs[0];

  for (let i = 1; i < runs.length; i++) {
    const next = runs[i];
    if (
      current.bold === next.bold &&
      current.italics === next.italics &&
      current.link === next.link &&
      current.decoration === next.decoration
    ) {
      current = { ...current, text: current.text + next.text };
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);
  return merged;
}

function collectTextRuns(element: Element): NotePdfInlineRun[][] {
  return Array.from(element.childNodes)
    .reduce<NotePdfInlineRun[][]>(
      (segments, childNode) =>
        appendInlineSegments(segments, collectInlineSegments(childNode)),
      [[]]
    )
    .map((runs) => mergeRuns(runs.filter((run) => run.text.length > 0)))
    .filter((runs) => runs.some((run) => run.text.trim().length > 0));
}

function pushParagraphBlocks(
  blocks: NotePdfContentBlock[],
  segments: NotePdfInlineRun[][]
) {
  segments.forEach((runs) => {
    if (runs.length > 0) {
      blocks.push({ runs, type: 'paragraph' });
    }
  });
}

function parseElementToBlocks(
  element: Element,
  blocks: NotePdfContentBlock[]
): void {
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'script' || tagName === 'style') {
    return;
  }

  if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
    const [runs] = collectTextRuns(element);
    if (runs?.length) {
      blocks.push({
        level: Number(tagName.slice(1)) as 1 | 2 | 3,
        runs,
        type: 'heading',
      });
    }
    return;
  }

  if (tagName === 'ul' || tagName === 'ol') {
    const items = Array.from(element.querySelectorAll(':scope > li'))
      .map((listItem) => collectTextRuns(listItem).flat())
      .filter((runs) => runs.length > 0);

    if (items.length > 0) {
      blocks.push({
        items,
        ordered: tagName === 'ol',
        type: 'list',
      });
    }
    return;
  }

  if (tagName === 'p' || tagName === 'div') {
    pushParagraphBlocks(blocks, collectTextRuns(element));
    return;
  }

  const segments = collectTextRuns(element);
  if (segments.length > 0) {
    pushParagraphBlocks(blocks, segments);
  }
}

/**
 * Strips bold / italic wrapper tags so the DOMParser only sees plain text
 * inside block-level elements.  This prevents pdfmake from creating
 * separate text-run objects per inline tag, which historically caused it
 * to swallow the whitespace between runs.
 */
function stripInlineStyleTags(html: string): string {
  return html
    .replace(/<\/?(strong|b|em|i)\s*>/gi, '');
}

export function parseNoteHtmlToPdfBlocks(html: string): NotePdfContentBlock[] {
  const parser = new DOMParser();
  const sanitizedHtml = stripInlineStyleTags(html);
  const documentNode = parser.parseFromString(sanitizedHtml, 'text/html');
  const blocks: NotePdfContentBlock[] = [];

  Array.from(documentNode.body.children).forEach((element) => {
    parseElementToBlocks(element, blocks);
  });

  if (blocks.length === 0) {
    pushParagraphBlocks(blocks, collectTextRuns(documentNode.body));
  }

  return blocks;
}
