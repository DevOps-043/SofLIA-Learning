// @vitest-environment jsdom

import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  afterEachNotesTest,
  beforeEachNotesTest,
  createJsonResponse,
  moduleWithLessons,
  renderNotesManagement,
} from "./notes-management-hook.test-utils";

describe("useNotesManagement SofLIA drafts", () => {
  beforeEach(beforeEachNotesTest);
  afterEach(afterEachNotesTest);

  it("saves SofLIA drafts using the lesson where the draft was created", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/courses/curso-demo/notes") return createJsonResponse([]);
      if (url === "/api/courses/curso-demo/notes/stats") return createJsonResponse({ totalNotes: 1, lessonsWithNotes: 1, totalLessons: 2, lastUpdate: "2026-04-09T12:00:00.000Z" });
      if (url === "/api/courses/curso-demo/lessons/lesson-origin/notes") {
        return createJsonResponse({
          note_id: "note-lia",
          note_title: "SofLIA: Leccion de origen",
          note_content: "<p>Idea clave</p>",
          lesson_id: "lesson-origin",
          note_tags: ["SofLIA", "Clase"],
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    global.fetch = fetchMock as typeof fetch;

    const { result } = renderNotesManagement({
      currentLesson: { lesson_id: "lesson-origin", lesson_title: "Leccion de origen" },
      modules: [
        moduleWithLessons([
          { lesson_id: "lesson-origin", lesson_title: "Leccion de origen" },
          { lesson_id: "lesson-next", lesson_title: "Leccion siguiente" },
        ]),
      ],
    });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    act(() => result.current.openLiaNoteModal("<p>Idea clave</p>"));

    expect(result.current.editingNote).toMatchObject({
      lessonId: "lesson-origin",
      title: "SofLIA: Leccion de origen",
    });

    let wasSaved = false;
    await act(async () => {
      wasSaved = await result.current.handleSaveNote({
        title: result.current.editingNote?.title || "",
        content: result.current.editingNote?.content || "",
        tags: result.current.editingNote?.tags || [],
      });
    });

    expect(wasSaved).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/courses/curso-demo/lessons/lesson-origin/notes",
      expect.objectContaining({
        // La organización ya no viaja en el body: el servidor la deriva de la
        // inscripción (o del query param orgId cuando hay contexto organizacional).
        body: JSON.stringify({
          note_title: "SofLIA: Leccion de origen",
          note_content: "<p>Idea clave</p>",
          note_tags: ["SofLIA", "Clase"],
          source_type: "manual",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );
  });
});
