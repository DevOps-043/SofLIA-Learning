import { normalizeGeneratedNoteHtml } from "@/lib/notes/generated-note-html";

interface LabeledItem {
  detail: string;
  label: string;
}

interface LessonAutoNoteTitles {
  activityFeedback: string;
  index: string;
  lessonContent: string;
  quizFeedback: string;
  review: string;
  sofliaHighlights: string;
  summary: string;
}

interface LessonAutoNoteDocument {
  activityFeedback: LabeledItem[];
  lessonKeyPoints: LabeledItem[];
  lessonOverview: string[];
  quizFeedback: LabeledItem[];
  reviewChecklist: string[];
  sofliaHighlights: LabeledItem[];
  strategicSummary: string[];
  titles: LessonAutoNoteTitles;
}

export interface LessonAutoNoteFallbackInput {
  activityNotes: string[];
  dialogueHighlights: string[];
  lessonDescription: string | null;
  lessonSummary: string | null;
  lessonTitle: string;
  quizReviews: string[];
  transcript: string | null;
}

const DEFAULT_TITLES: LessonAutoNoteTitles = {
  activityFeedback: "Retroalimentación de la actividad",
  index: "Índice",
  lessonContent: "Video, lectura y reflexión",
  quizFeedback: "Retroalimentación del quiz",
  review: "Para repasar",
  sofliaHighlights: "Puntos clave de mi interacción con SofLIA",
  summary: "Resumen estratégico",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeText(value: unknown, maxLength = 2_000): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toStringArray(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .slice(0, limit);
}

function toLabeledItems(value: unknown, limit: number): LabeledItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): LabeledItem | null => {
      if (typeof item === "string") {
        const detail = normalizeText(item);
        return detail ? { detail, label: "" } : null;
      }

      const record = toRecord(item);
      const detail = normalizeText(record.detail);
      const label = normalizeText(record.label, 120);
      return detail || label ? { detail, label } : null;
    })
    .filter((item): item is LabeledItem => item !== null)
    .slice(0, limit);
}

function parseJsonResponse(value: string): Record<string, unknown> | null {
  const normalized = value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed: unknown = JSON.parse(normalized);
    const record = toRecord(parsed);
    return Object.keys(record).length > 0 ? record : null;
  } catch {
    return null;
  }
}

function parseTitles(value: unknown): LessonAutoNoteTitles {
  const titles = toRecord(value);
  return {
    activityFeedback:
      normalizeText(titles.activityFeedback, 120) ||
      DEFAULT_TITLES.activityFeedback,
    index: normalizeText(titles.index, 80) || DEFAULT_TITLES.index,
    lessonContent:
      normalizeText(titles.lessonContent, 120) || DEFAULT_TITLES.lessonContent,
    quizFeedback:
      normalizeText(titles.quizFeedback, 120) || DEFAULT_TITLES.quizFeedback,
    review: normalizeText(titles.review, 120) || DEFAULT_TITLES.review,
    sofliaHighlights:
      normalizeText(titles.sofliaHighlights, 160) ||
      DEFAULT_TITLES.sofliaHighlights,
    summary: normalizeText(titles.summary, 120) || DEFAULT_TITLES.summary,
  };
}

function parseDocument(value: string): LessonAutoNoteDocument | null {
  const response = parseJsonResponse(value);
  if (!response) return null;

  const document: LessonAutoNoteDocument = {
    activityFeedback: toLabeledItems(response.activityFeedback, 8),
    lessonKeyPoints: toLabeledItems(response.lessonKeyPoints, 8),
    lessonOverview: toStringArray(response.lessonOverview, 4),
    quizFeedback: toLabeledItems(response.quizFeedback, 10),
    reviewChecklist: toStringArray(response.reviewChecklist, 8),
    sofliaHighlights: toLabeledItems(response.sofliaHighlights, 8),
    strategicSummary: toStringArray(response.strategicSummary, 4),
    titles: parseTitles(response.titles),
  };

  const detailCount =
    document.activityFeedback.length +
    document.lessonKeyPoints.length +
    document.lessonOverview.length +
    document.quizFeedback.length +
    document.reviewChecklist.length +
    document.sofliaHighlights.length;

  return document.strategicSummary.length > 0 && detailCount >= 3
    ? document
    : null;
}

function renderParagraphs(items: string[]): string {
  return items.map((item) => `<p>${escapeHtml(item)}</p>`).join("");
}

function renderLabeledItems(items: LabeledItem[], type: "ol" | "ul"): string {
  if (items.length === 0) return "";

  return `<${type}>${items
    .map((item) => {
      const label = item.label
        ? `<strong>${escapeHtml(item.label)}${item.detail ? ":" : ""}</strong>`
        : "";
      const separator = label && item.detail ? " " : "";
      return `<li>${label}${separator}${escapeHtml(item.detail)}</li>`;
    })
    .join("")}</${type}>`;
}

function renderStringItems(items: string[], type: "ol" | "ul"): string {
  if (items.length === 0) return "";
  return `<${type}>${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</${type}>`;
}

function renderDocument(document: LessonAutoNoteDocument): string {
  const { titles } = document;
  const sectionTitles = [
    titles.summary,
    titles.lessonContent,
    titles.sofliaHighlights,
    titles.activityFeedback,
    titles.quizFeedback,
    titles.review,
  ];

  return [
    `<h2>${escapeHtml(titles.index)}</h2>`,
    renderStringItems(sectionTitles, "ol"),
    `<h2>${escapeHtml(titles.summary)}</h2>`,
    renderParagraphs(document.strategicSummary),
    `<h2>${escapeHtml(titles.lessonContent)}</h2>`,
    renderParagraphs(document.lessonOverview),
    renderLabeledItems(document.lessonKeyPoints, "ul"),
    `<h2>${escapeHtml(titles.sofliaHighlights)}</h2>`,
    renderLabeledItems(document.sofliaHighlights, "ul"),
    `<h2>${escapeHtml(titles.activityFeedback)}</h2>`,
    renderLabeledItems(document.activityFeedback, "ul"),
    `<h2>${escapeHtml(titles.quizFeedback)}</h2>`,
    renderLabeledItems(document.quizFeedback, "ol"),
    `<h2>${escapeHtml(titles.review)}</h2>`,
    renderStringItems(document.reviewChecklist, "ol"),
  ].join("");
}

/**
 * Converts Gemini's JSON payload into deterministic semantic HTML. The legacy
 * fallback keeps older HTML/markdown responses usable during deployment or a
 * temporary model-format deviation.
 */
export function buildLessonAutoNoteHtmlFromModel(value: string): string {
  const document = parseDocument(value);
  if (document) {
    return normalizeGeneratedNoteHtml(renderDocument(document), "lesson_auto_note");
  }

  if (value.trim().startsWith("{")) return "";
  return normalizeGeneratedNoteHtml(value, "lesson_auto_note");
}

function renderFallbackList(items: string[], emptyText: string): string {
  const normalized = items
    .map((item) => normalizeText(item, 2_500))
    .filter(Boolean)
    .slice(0, 20);

  if (normalized.length === 0) {
    return `<p><em>${escapeHtml(emptyText)}</em></p>`;
  }

  return `<ul>${normalized
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

/**
 * Immediate, evidence-based fallback used when Gemini is unavailable or its
 * structured response is invalid. It intentionally contains no invented
 * interpretation: only lesson text and public learner feedback are rendered.
 */
export function buildDeterministicLessonAutoNoteHtml(
  input: LessonAutoNoteFallbackInput,
): string {
  const overview =
    normalizeText(input.lessonSummary, 4_000) ||
    normalizeText(input.lessonDescription, 2_000) ||
    normalizeText(input.transcript, 4_000) ||
    `Completaste la lección ${input.lessonTitle}.`;

  return normalizeGeneratedNoteHtml(
    [
      "<h2>Resumen de la lección</h2>",
      `<p>${escapeHtml(overview)}</p>`,
      "<h2>Conceptos y evidencias</h2>",
      renderFallbackList(
        input.activityNotes,
        "No se registraron entregas adicionales para esta lección.",
      ),
      "<h2>Retroalimentación de SofLIA</h2>",
      renderFallbackList(
        [...input.dialogueHighlights, ...input.quizReviews],
        "No hubo retroalimentación adicional; el apunte se construyó con el contenido disponible.",
      ),
      "<h2>Para ponerlo en práctica</h2>",
      "<ol><li>Explica con tus propias palabras la idea principal.</li><li>Elige una situación real donde puedas aplicarla.</li><li>Registra el resultado y la duda que quieras revisar con SofLIA.</li></ol>",
      "<h2>Preguntas de repaso</h2>",
      "<ol><li>¿Qué aprendí y qué evidencia lo demuestra?</li><li>¿Qué debo reforzar?</li><li>¿Cuál es mi siguiente acción concreta?</li></ol>",
    ].join(""),
    "lesson_auto_note",
  );
}
