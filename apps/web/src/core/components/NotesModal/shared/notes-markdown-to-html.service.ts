/**
 * Converts markdown text (as produced by SofLIA/AI) into semantic HTML
 * suitable for the notes WYSIWYG editor and, critically, for the PDF export
 * pipeline (notes-pdf-content-parser.service → notes-pdf-definition.service).
 *
 * Supported markdown constructs:
 *   - Headings:  ## / ### (h2, h3)
 *   - Unordered lists:  - item / * item
 *   - Ordered lists:  1. item
 *   - Bold:  **text**
 *   - Italic:  *text*
 *   - Links:  [text](url)
 *   - Inline code:  `code`
 *   - Paragraphs (double newline separation)
 *
 * Design constraints (prompt_maestro §2, §3, §4):
 *   - Pure function, no side-effects, easily testable.
 *   - Single responsibility: markdown string → HTML string.
 *   - No external dependencies; the regex patterns cover the subset of
 *     markdown that SofLIA actually produces — no need for a full library.
 */

// ---------------------------------------------------------------------------
// Inline formatting
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Processes inline markdown formatting within a single text line.
 * Order matters: links first (to avoid ** inside link text being consumed),
 * then bold (**), then italic (*), then inline code (`).
 */
function convertInlineFormatting(line: string): string {
  return (
    line
      // Links:  [text](url)
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (_match, text: string, url: string) => {
          const safeUrl = /^(https?:\/\/|mailto:|tel:|\/)/i.test(url.trim())
            ? url.trim()
            : '';
          if (!safeUrl) {
            return escapeHtml(text);
          }
          return `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
        },
      )
      // Bold:  **text**
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic:  *text*  (single asterisk, must not start another bold)
      .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>')
      // Inline code:  `code`
      .replace(/`([^`]+)`/g, '<code>$1</code>')
  );
}

// ---------------------------------------------------------------------------
// Block-level parsing
// ---------------------------------------------------------------------------

interface ParsedBlock {
  html: string;
}

/** Detect heading lines:  ## Heading  or  ### Heading */
const HEADING_RE = /^(#{2,3})\s+(.+)$/;

/** Detect unordered list items:  - item  or  * item  (with optional leading spaces) */
const UNORDERED_LIST_RE = /^\s*[-*]\s+(.+)$/;

/** Detect ordered list items:  1. item  (with optional leading spaces) */
const ORDERED_LIST_RE = /^\s*\d+\.\s+(.+)$/;

/**
 * Groups consecutive lines into semantic blocks (headings, lists, paragraphs).
 *
 * Algorithm:
 *   1. Split input by newlines.
 *   2. Walk lines sequentially, accumulating runs of same-type lines
 *      (e.g. consecutive list items become a single <ul>/<ol>).
 *   3. Blank lines flush the current accumulator.
 */
function parseMarkdownToBlocks(markdown: string): ParsedBlock[] {
  const normalizedInput = markdown
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, '  ');

  const lines = normalizedInput.split('\n');
  const blocks: ParsedBlock[] = [];

  let currentListType: 'ul' | 'ol' | null = null;
  let currentListItems: string[] = [];
  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length === 0) {
      return;
    }
    const joinedText = currentParagraphLines.join(' ').trim();
    if (joinedText) {
      blocks.push({ html: `<p>${convertInlineFormatting(joinedText)}</p>` });
    }
    currentParagraphLines = [];
  };

  const flushList = () => {
    if (currentListItems.length === 0 || !currentListType) {
      return;
    }
    const tag = currentListType;
    const itemsHtml = currentListItems
      .map((item) => `<li>${convertInlineFormatting(item)}</li>`)
      .join('');
    blocks.push({ html: `<${tag}>${itemsHtml}</${tag}>` });
    currentListItems = [];
    currentListType = null;
  };

  for (const rawLine of lines) {
    const line = rawLine;

    // Blank line — flush any accumulators
    if (line.trim() === '') {
      flushParagraph();
      flushList();
      continue;
    }

    // Heading
    const headingMatch = line.match(HEADING_RE);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length; // 2 or 3
      const text = headingMatch[2].trim();
      blocks.push({
        html: `<h${level}>${convertInlineFormatting(text)}</h${level}>`,
      });
      continue;
    }

    // Unordered list item
    const ulMatch = line.match(UNORDERED_LIST_RE);
    if (ulMatch) {
      flushParagraph();
      if (currentListType === 'ol') {
        flushList();
      }
      currentListType = 'ul';
      currentListItems.push(ulMatch[1].trim());
      continue;
    }

    // Ordered list item
    const olMatch = line.match(ORDERED_LIST_RE);
    if (olMatch) {
      flushParagraph();
      if (currentListType === 'ul') {
        flushList();
      }
      currentListType = 'ol';
      currentListItems.push(olMatch[1].trim());
      continue;
    }

    // Regular text — accumulate as paragraph content
    if (currentListType) {
      flushList();
    }
    currentParagraphLines.push(line);
  }

  // Final flush
  flushParagraph();
  flushList();

  return blocks;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Converts a markdown string (SofLIA message content) into semantic HTML
 * that can be consumed by the WYSIWYG editor and the PDF export pipeline.
 *
 * @param markdown - Raw markdown text from SofLIA/AI.
 * @returns        - Semantic HTML string with <h2>, <h3>, <p>, <ul>, <ol>,
 *                   <strong>, <em>, <a>, <code> elements.
 */
export function convertNoteMarkdownToHtml(markdown: string): string {
  if (!markdown || !markdown.trim()) {
    return '';
  }

  const blocks = parseMarkdownToBlocks(markdown);
  return blocks.map((block) => block.html).join('');
}
