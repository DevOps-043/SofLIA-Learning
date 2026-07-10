import { sanitizeHtml } from "@/lib/sanitize/html-sanitizer.core";

export type GeneratedNoteKind = "lesson_auto_note" | "course_compendium";

type SectionMode = "paragraphs" | "bullets" | "steps";

interface SectionDefinition {
  aliases: string[];
  mode: SectionMode;
}

interface SectionMatch {
  bodyStart: number;
  definition: SectionDefinition;
  start: number;
  title: string;
}

const LESSON_SECTIONS: SectionDefinition[] = [
  {
    aliases: [
      "Resumen estratégico",
      "Resumen estrategico",
      "Strategic summary",
      "Resumo estratégico",
      "Resumo estrategico",
    ],
    mode: "paragraphs",
  },
  {
    aliases: [
      "Video, lectura y reflexión",
      "Video, lectura y reflexion",
      "Video, reading and reflection",
      "Vídeo, leitura e reflexão",
      "Video, leitura e reflexao",
    ],
    mode: "paragraphs",
  },
  {
    aliases: [
      "Puntos clave de mi interacción con SofLIA",
      "Puntos clave de mi interaccion con SofLIA",
      "Key points from my interaction with SofLIA",
      "Pontos-chave da minha interação com a SofLIA",
      "Pontos-chave da minha interacao com a SofLIA",
    ],
    mode: "bullets",
  },
  {
    aliases: [
      "Retroalimentación de la actividad",
      "Retroalimentacion de la actividad",
      "Activity feedback",
      "Feedback da atividade",
    ],
    mode: "bullets",
  },
  {
    aliases: [
      "Retroalimentación del quiz",
      "Retroalimentacion del quiz",
      "Quiz feedback",
      "Feedback do quiz",
    ],
    mode: "steps",
  },
  {
    aliases: ["Para repasar", "Review guide", "Para revisar"],
    mode: "steps",
  },
  {
    aliases: [
      "Transcripción completa de mi diálogo con SofLIA",
      "Transcripcion completa de mi dialogo con SofLIA",
      "Full transcript of my dialogue with SofLIA",
      "Transcrição completa do meu diálogo com a SofLIA",
      "Transcricao completa do meu dialogo com a SofLIA",
    ],
    mode: "paragraphs",
  },
];

const COMPENDIUM_SECTIONS: SectionDefinition[] = [
  {
    aliases: [
      "Síntesis del curso",
      "Sintesis del curso",
      "Course synthesis",
      "Síntese do curso",
      "Sintese do curso",
    ],
    mode: "paragraphs",
  },
  {
    aliases: [
      "Conceptos clave",
      "Key concepts",
      "Conceitos-chave",
      "Conceitos chave",
    ],
    mode: "bullets",
  },
  {
    aliases: [
      "Guía de repaso",
      "Guia de repaso",
      "Review guide",
      "Guia de revisão",
      "Guia de revisao",
    ],
    mode: "steps",
  },
  {
    aliases: [
      "Mis apuntes por lección",
      "Mis apuntes por leccion",
      "My lesson notes",
      "Minhas anotações por lição",
      "Minhas anotacoes por licao",
    ],
    mode: "paragraphs",
  },
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function htmlToReadableText(value: string): string {
  return decodeEntities(
    value
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/(?:p|div|h[1-6]|li|blockquote)>/gi, "\n")
      .replace(/<li\b[^>]*>/gi, "• ")
      .replace(/<[^>]*>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getIndexTitle(firstSectionTitle: string): string {
  return /^(?:Strategic|Course|Video, reading|Key points|Activity|Quiz|Review|Full transcript|My lesson)/iu.test(
    firstSectionTitle,
  )
    ? "Contents"
    : "Índice";
}

function renderNoteIndex(title: string, items: string[]): string {
  return `<div class="notebook-note-index"><h2>${escapeHtml(
    title,
  )}</h2><ol>${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ol></div>`;
}

function wrapExistingLeadingIndex(value: string): string {
  if (/class=["'][^"']*notebook-note-index/iu.test(value)) return value;

  const leadingIndex = value.match(
    /^\s*(<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>\s*<ol\b[^>]*>[\s\S]*?<\/ol>)/iu,
  );
  if (!leadingIndex) return value;

  const title = htmlToReadableText(leadingIndex[2]);
  if (!/^(?:índice|indice|contents|sumário|sumario)$/iu.test(title)) {
    return value;
  }

  return value.replace(
    leadingIndex[0],
    `<div class="notebook-note-index">${leadingIndex[1]}</div>`,
  );
}

function ensureGeneratedNoteIndex(value: string): string {
  const headings = Array.from(
    value.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi),
    (match) => htmlToReadableText(match[1]),
  ).filter(Boolean);

  if (headings.length < 2) return value;
  if (/^(?:índice|indice|contents|sumário|sumario)$/iu.test(headings[0])) {
    return wrapExistingLeadingIndex(value);
  }

  const title = getIndexTitle(headings[0]);
  const noteIndex = renderNoteIndex(title, headings);
  return `${noteIndex}${value}`;
}

function splitSentences(value: string): string[] {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const sentences = normalized.match(/[^.!?]+(?:[.!?]+["'”’)]*|$)/gu);
  return (sentences ?? [normalized])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function renderInlineLabel(value: string): string {
  const normalized = value
    .replace(/^\s*(?:[-*•]\s+|\d+[.)]\s+)/u, "")
    .trim();
  const labelMatch = normalized.match(/^([^:]{2,80}):\s+(.+)$/u);

  if (!labelMatch) return renderInlineMarkdown(normalized);

  return `<strong>${escapeHtml(labelMatch[1].trim())}:</strong> ${renderInlineMarkdown(
    labelMatch[2].trim(),
  )}`;
}

/**
 * Converts the small inline Markdown dialect used by SofLIA into safe HTML.
 * Escaping happens before tags are introduced, so legacy model/user text
 * cannot become executable markup while it is normalized.
 */
function renderInlineMarkdown(value: string): string {
  let escaped = escapeHtml(value);

  escaped = escaped.replace(
    /\[([^\]]+)\]\((https?:\/\/|mailto:|tel:)([^)]+)\)/giu,
    (_match, label: string, protocol: string, rest: string) =>
      `<a href="${protocol}${rest}" target="_blank" rel="noopener noreferrer">${renderInlineMarkdown(
        label,
      )}</a>`,
  );
  escaped = escaped.replace(/\*\*(.+?)\*\*/gu, "<strong>$1</strong>");
  escaped = escaped.replace(/__([^_\n]+?)__/gu, "<strong>$1</strong>");
  escaped = escaped.replace(
    /(?<!\*)\*([^*\n]+?)\*(?!\*)/gu,
    "<em>$1</em>",
  );
  escaped = escaped.replace(
    /(?<!_)_([^_\n]+?)_(?!_)/gu,
    "<em>$1</em>",
  );
  escaped = escaped.replace(/`([^`\n]+)`/gu, "<code>$1</code>");

  return escaped;
}

function explicitListItems(value: string): string[] {
  const lines = value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];
  if (!lines.every((line) => /^(?:[-*•]|\d+[.)])\s+/u.test(line))) return [];

  return lines;
}

function renderParagraphs(value: string): string {
  const explicitParagraphs = value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

  if (explicitParagraphs.length > 1) {
    return explicitParagraphs
      .map((paragraph) => `<p>${renderInlineLabel(paragraph)}</p>`)
      .join("");
  }

  const sentences = splitSentences(value);
  if (sentences.length === 0) return "";

  const paragraphs: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current && current.length + sentence.length > 430) {
      paragraphs.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) paragraphs.push(current);

  return paragraphs
    .map((paragraph) => `<p>${renderInlineLabel(paragraph)}</p>`)
    .join("");
}

function renderList(
  value: string,
  mode: Exclude<SectionMode, "paragraphs">,
): string {
  const items = explicitListItems(value);
  const normalizedItems = items.length > 0 ? items : splitSentences(value);
  if (normalizedItems.length === 0) return "";

  const tag = mode === "steps" ? "ol" : "ul";
  return `<${tag}>${normalizedItems
    .slice(0, 24)
    .map((item) => `<li>${renderInlineLabel(item)}</li>`)
    .join("")}</${tag}>`;
}

function findSectionMatches(
  plainText: string,
  definitions: SectionDefinition[],
): SectionMatch[] {
  const matches: SectionMatch[] = [];
  let cursor = 0;

  for (const definition of definitions) {
    const aliases = [...definition.aliases]
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp)
      .join("|");
    const pattern = new RegExp(
      `(?:^|[\\s.!?])(${aliases})\\s*(?:[:\\-–—]\\s*)?`,
      "iu",
    );
    const remaining = plainText.slice(cursor);
    const match = pattern.exec(remaining);
    if (!match || match.index === undefined) continue;

    const matchedTitle = match[1];
    const titleOffset = match[0].indexOf(matchedTitle);
    const start = cursor + match.index + titleOffset;
    const bodyStart = cursor + match.index + match[0].length;

    matches.push({
      bodyStart,
      definition,
      start,
      title: matchedTitle,
    });
    cursor = bodyStart;
  }

  return matches;
}

function renderLegacySections(
  plainText: string,
  definitions: SectionDefinition[],
): string | null {
  const matches = findSectionMatches(plainText, definitions);
  if (matches.length < 2) return null;

  const indexTitle = getIndexTitle(matches[0].title);
  const noteIndex = renderNoteIndex(
    indexTitle,
    matches.map((match) => match.title),
  );

  const sections = matches.map((match, index) => {
    const end = matches[index + 1]?.start ?? plainText.length;
    const body = plainText
      .slice(match.bodyStart, end)
      .replace(/^\s*[:\-–—]\s*/u, "")
      .trim();
    const content =
      match.definition.mode === "paragraphs"
        ? renderParagraphs(body)
        : renderList(body, match.definition.mode);

    return `<h2>${escapeHtml(match.title)}</h2>${content}`;
  });

  return `${noteIndex}${sections.join("")}`;
}

function convertSimpleMarkdown(value: string): string | null {
  const lines = value.replace(/\r\n?/g, "\n").split("\n");
  if (
    !lines.some(
      (line) =>
        /^(?:#{1,4}|\s*[-*•]|\s*\d+[.)])\s+/u.test(line) ||
        /\*\*[^*]+\*\*|__[^_]+__|`[^`]+`/u.test(line),
    )
  ) {
    return null;
  }

  const blocks: string[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushParagraph = () => {
    const text = paragraph.join(" ").trim();
    if (text) blocks.push(`<p>${renderInlineLabel(text)}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (listType && listItems.length > 0) {
      blocks.push(
        `<${listType}>${listItems
          .map((item) => `<li>${renderInlineLabel(item)}</li>`)
          .join("")}</${listType}>`,
      );
    }
    listItems = [];
    listType = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/u);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(heading[1].length, 4);
      blocks.push(
        `<h${level}>${renderInlineMarkdown(heading[2].trim())}</h${level}>`,
      );
      continue;
    }

    const unordered = line.match(/^[-*•]\s+(.+)$/u);
    const ordered = line.match(/^\d+[.)]\s+(.+)$/u);
    if (unordered || ordered) {
      flushParagraph();
      const nextType = unordered ? "ul" : "ol";
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      listItems.push((unordered?.[1] ?? ordered?.[1] ?? "").trim());
      continue;
    }

    if (listType) flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks.join("");
}

function renderPlainText(value: string): string {
  const blocks = value
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/u)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map(
      (block) =>
        `<p>${renderInlineLabel(block).replace(/\n/gu, "<br>")}</p>`,
    )
    .join("");
}

/**
 * Normalizes any note content, including older manual notes stored as plain
 * text. Existing rich HTML is preserved; Markdown and plain text receive
 * semantic blocks so the notebook and editor share the same hierarchy.
 */
export function normalizeNoteContentHtml(
  value: string | null | undefined,
): string {
  if (!value?.trim()) return "";

  const sanitized = sanitizeHtml(value, { level: "rich" }).trim();
  const hasBlockMarkup = /<(?:p|div|h[1-6]|ul|ol|blockquote|pre|hr)\b/iu.test(
    sanitized,
  );

  if (hasBlockMarkup) return sanitized;

  const hasInlineMarkup = /<(?:strong|b|em|i|u|s|del|mark|a|code|br)\b/iu.test(
    sanitized,
  );
  if (hasInlineMarkup) {
    return sanitizeHtml(`<p>${sanitized}</p>`, { level: "rich" }).trim();
  }

  const markdown = convertSimpleMarkdown(value);
  const html =
    markdown || renderPlainText(htmlToReadableText(sanitized || value));
  return sanitizeHtml(html, { level: "rich" }).trim();
}

/**
 * Makes generated notes resilient to legacy/plain model output. New notes are
 * already emitted as semantic HTML, while older flat notes are split around
 * their known section labels and receive paragraphs/lists deterministically.
 */
export function normalizeGeneratedNoteHtml(
  value: string | null | undefined,
  kind: GeneratedNoteKind,
): string {
  if (!value?.trim()) return "";

  const sanitized = sanitizeHtml(value, { level: "rich" }).trim();
  const structuralBlocks = sanitized.match(/<(?:h[1-6]|ul|ol|blockquote)\b/gi);

  if ((structuralBlocks?.length ?? 0) >= 2) {
    return ensureGeneratedNoteIndex(sanitized);
  }

  const markdown = convertSimpleMarkdown(value);
  if (markdown) {
    return ensureGeneratedNoteIndex(
      sanitizeHtml(markdown, { level: "rich" }).trim(),
    );
  }

  const plainText = htmlToReadableText(sanitized || value);
  const definitions =
    kind === "course_compendium" ? COMPENDIUM_SECTIONS : LESSON_SECTIONS;
  const structured = renderLegacySections(plainText, definitions);
  if (structured) {
    return sanitizeHtml(structured, { level: "rich" }).trim();
  }

  const paragraphCount = sanitized.match(/<p\b/gi)?.length ?? 0;
  if (paragraphCount >= 2) return sanitized;

  return sanitizeHtml(renderParagraphs(plainText), { level: "rich" }).trim();
}
