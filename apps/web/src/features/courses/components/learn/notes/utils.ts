"use client";

import type {
  LearnEditableNote,
  LearnGeneratedModuleSummary,
  LearnNoteListItem,
  LearnNoteFormData,
  LearnNotesStats,
  LearnSavedNote,
} from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getNumber(
  record: Record<string, unknown>,
  key: string
): number | undefined {
  const value = record[key];

  return typeof value === "number" ? value : undefined;
}

function getString(
  record: Record<string, unknown>,
  key: string
): string | undefined {
  const value = record[key];

  return typeof value === "string" ? value : undefined;
}

function getStringArray(
  record: Record<string, unknown>,
  key: string
): string[] | undefined {
  const value = record[key];

  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function getDefaultNotesStats(totalLessons: number): LearnNotesStats {
  return {
    totalNotes: 0,
    lessonsWithNotes: totalLessons > 0 ? `0/${totalLessons}` : "0/0",
    lastUpdate: "-",
  };
}

export function htmlToPlainText(
  html: string,
  addLineBreaks: boolean = true
): string {
  if (!html) {
    return "";
  }

  if (typeof document === "undefined") {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
  }

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const lists = tempDiv.querySelectorAll("ul, ol");
  lists.forEach((list) => {
    const items = list.querySelectorAll("li");

    items.forEach((item, index) => {
      const prefix = list.tagName.toLowerCase() === "ol" ? `${index + 1}. ` : "• ";
      const text = item.textContent?.trim() || "";
      item.textContent = addLineBreaks ? `${prefix}${text}\n` : `${prefix}${text}`;
    });
  });

  if (addLineBreaks) {
    const paragraphs = tempDiv.querySelectorAll("p, div");
    paragraphs.forEach((paragraph) => {
      if (paragraph.textContent && !paragraph.textContent.trim().endsWith("\n")) {
        paragraph.textContent = `${paragraph.textContent}\n`;
      }
    });
  }

  const rawText = tempDiv.textContent || tempDiv.innerText || "";
  const collapsedText = addLineBreaks
    ? rawText.replace(/\n{3,}/g, "\n\n")
    : rawText;

  return collapsedText.trim();
}

export function generateNotePreview(
  html: string,
  maxLength: number = 50
): string {
  if (!html) {
    return "";
  }

  if (typeof document === "undefined") {
    const plainText = htmlToPlainText(html, false);
    return plainText.length > maxLength
      ? `${plainText.slice(0, maxLength)}...`
      : plainText;
  }

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const firstChild = tempDiv.firstElementChild;

  if (firstChild && ["UL", "OL"].includes(firstChild.tagName)) {
    const firstItem = firstChild.querySelector("li");

    if (firstItem) {
      const prefix = firstChild.tagName === "OL" ? "1. " : "• ";
      const preview = `${prefix}${firstItem.textContent?.trim() || ""}`;

      return preview.length > maxLength
        ? `${preview.slice(0, maxLength)}...`
        : `${preview}...`;
    }
  }

  const plainText = htmlToPlainText(html, false);

  return plainText.length > maxLength
    ? `${plainText.slice(0, maxLength)}...`
    : plainText;
}

export function formatNoteTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "Ahora";
  }

  if (diffMins < 60) {
    return `Hace ${diffMins} minuto${diffMins > 1 ? "s" : ""}`;
  }

  if (diffHours < 24) {
    return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  }

  if (diffDays === 1) {
    return "Ayer";
  }

  if (diffDays < 7) {
    return `Hace ${diffDays} dias`;
  }

  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

function buildSavedNote(
  id: string,
  title: string,
  content: string,
  lessonId: string,
  timestamp: string,
  tags: string[]
): LearnSavedNote {
  return {
    id,
    title,
    content: generateNotePreview(content, 50),
    timestamp,
    lessonId,
    fullContent: content,
    tags,
  };
}

export function mapApiNoteToSavedNote(note: unknown): LearnSavedNote | null {
  if (!isRecord(note)) {
    return null;
  }

  const id = getString(note, "note_id");
  const title = getString(note, "note_title");
  const lessonId = getString(note, "lesson_id");
  const content = getString(note, "note_content") || "";
  const timestampSource =
    getString(note, "updated_at") || getString(note, "created_at");

  if (!id || !title || !lessonId) {
    return null;
  }

  return buildSavedNote(
    id,
    title,
    content,
    lessonId,
    formatNoteTimestamp(timestampSource || new Date().toISOString()),
    getStringArray(note, "note_tags") || []
  );
}

export function mapApiSummaryToGeneratedNote(
  summary: unknown,
  moduleTitleById: Map<string, string>
): LearnGeneratedModuleSummary | null {
  if (!isRecord(summary)) {
    return null;
  }

  const id = getString(summary, "summary_id");
  const moduleId = getString(summary, "module_id");
  const title = getString(summary, "title");
  const status = getString(summary, "status");
  const version = getNumber(summary, "version") || 1;
  const contentHtml = getString(summary, "content_html") || "";
  const rawErrorMessage = getString(summary, "error_message") || null;
  const generationType = getString(summary, "generation_type");
  const timestampSource =
    getString(summary, "generated_at") ||
    getString(summary, "updated_at") ||
    getString(summary, "created_at");

  if (!id || !moduleId || !title) {
    return null;
  }

  const normalizedStatus =
    status === "generating" || status === "failed" || status === "ready"
      ? status
      : "failed";
  const errorMessage = normalizedStatus === "failed" ? rawErrorMessage : null;

  return {
    kind: "module_learning_summary",
    id,
    moduleId,
    moduleTitle: moduleTitleById.get(moduleId),
    title,
    content:
      normalizedStatus === "ready"
        ? generateNotePreview(contentHtml, 70)
        : errorMessage || "",
    fullContent: contentHtml,
    timestamp: formatNoteTimestamp(timestampSource || new Date().toISOString()),
    updatedAt: timestampSource,
    version,
    status: normalizedStatus,
    generationType:
      generationType === "manual_regeneration" ? generationType : "default",
    errorMessage,
    canRegenerate: normalizedStatus !== "generating",
  };
}

export function buildSavedNoteFromMutation(
  note: unknown,
  lessonId: string
): LearnSavedNote | null {
  if (!isRecord(note)) {
    return null;
  }

  const id = getString(note, "note_id") || getString(note, "id");
  const title = getString(note, "note_title") || getString(note, "title");
  const content = getString(note, "note_content") || getString(note, "content") || "";

  if (!id || !title) {
    return null;
  }

  return buildSavedNote(
    id,
    title,
    content,
    lessonId,
    "Ahora",
    getStringArray(note, "note_tags") || getStringArray(note, "tags") || []
  );
}

export function getNotePreviewText(note: LearnNoteListItem): string {
  return note.content || generateNotePreview(note.fullContent || "", 50);
}

function buildLiaNoteTitle(lessonTitle?: string): string {
  if (!lessonTitle?.trim()) {
    return "Nota de SofLIA";
  }

  return `SofLIA: ${lessonTitle.trim()}`;
}

export function buildLiaDraftNote(
  content: string,
  options: {
    lessonId?: string;
    lessonTitle?: string;
  } = {}
): LearnEditableNote {
  return {
    id: "",
    lessonId: options.lessonId,
    title: buildLiaNoteTitle(options.lessonTitle),
    content,
    tags: ["SofLIA", "Clase"],
  };
}

export function normalizeNoteFormData(noteData: LearnNoteFormData) {
  return {
    note_title: noteData.title.trim(),
    note_content: noteData.content.trim(),
    note_tags: noteData.tags || [],
    source_type: "manual" as const,
  };
}
