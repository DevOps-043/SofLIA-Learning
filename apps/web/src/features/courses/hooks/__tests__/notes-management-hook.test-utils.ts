import { renderHook } from "@testing-library/react";
import { vi } from "vitest";

import { useNotesManagement } from "../useNotesManagement";

const originalAlert = global.alert;
const originalFetch = global.fetch;

export function createJsonResponse(body: unknown, status: number = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function beforeEachNotesTest() {
  vi.useFakeTimers();
  vi.clearAllMocks();
  global.alert = vi.fn();
}

export function afterEachNotesTest() {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  global.alert = originalAlert;
  global.fetch = originalFetch;
}

export const persistedLesson = {
  lesson_id: "lesson-note",
  lesson_title: "Leccion persistida",
};

export const currentLesson = {
  lesson_id: "current-lesson",
  lesson_title: "Leccion actual",
};

export function moduleWithLessons(lessons = [persistedLesson]) {
  return {
    module_id: "module-1",
    module_title: "Modulo 1",
    module_order_index: 1,
    lessons,
  };
}

type NotesOptions = Partial<Parameters<typeof useNotesManagement>[0]>;

export function renderNotesManagement(overrides: NotesOptions = {}) {
  return renderHook(() =>
    useNotesManagement({
      slug: "curso-demo",
      modules: [moduleWithLessons()],
      currentLesson,
      isNotesCollapsed: false,
      closeLia: vi.fn(),
      ...overrides,
    }),
  );
}

export function persistedNoteResponse(overrides: Record<string, unknown> = {}) {
  return {
    note_id: "note-1",
    note_title: "Nota previa",
    note_content: "Contenido previo",
    lesson_id: "lesson-note",
    updated_at: "2026-04-09T12:00:00.000Z",
    note_tags: ["manual"],
    ...overrides,
  };
}

export function notesStatsResponse(overrides: Record<string, unknown> = {}) {
  return {
    totalNotes: 0,
    lessonsWithNotes: 0,
    totalLessons: 1,
    lastUpdate: null,
    ...overrides,
  };
}
