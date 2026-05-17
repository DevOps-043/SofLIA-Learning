// @vitest-environment jsdom

import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  afterEachNotesTest,
  beforeEachNotesTest,
  createJsonResponse,
  moduleWithLessons,
  persistedNoteResponse,
  renderNotesManagement,
} from "./notes-management-hook.test-utils";

describe("useNotesManagement load and update", () => {
  beforeEach(beforeEachNotesTest);
  afterEach(afterEachNotesTest);

  it("loads course notes and enriches them with the lesson title", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse([
        persistedNoteResponse({
          note_title: "Transcripcion",
          note_content: "Contenido de nota",
          lesson_id: "lesson-1",
          note_tags: ["transcripcion"],
        }),
      ]),
    );
    global.fetch = fetchMock as typeof fetch;

    const { result } = renderNotesManagement({
      currentLesson: null,
      modules: [moduleWithLessons([{ lesson_id: "lesson-1", lesson_title: "Leccion de origen" }])],
    });

    await vi.waitFor(() => expect(result.current.savedNotes).toHaveLength(1));

    expect(result.current.savedNotes[0]?.lessonTitle).toBe("Leccion de origen");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/courses/curso-demo/notes",
      expect.objectContaining({ cache: "no-store", credentials: "include" }),
    );
  });

  it("updates a note using the persisted lessonId and keeps its lesson title", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createJsonResponse([persistedNoteResponse()]))
      .mockResolvedValueOnce(createJsonResponse(persistedNoteResponse({ note_title: "Nota actualizada" })));
    global.fetch = fetchMock as typeof fetch;

    const { result } = renderNotesManagement();
    await vi.waitFor(() => expect(result.current.savedNotes).toHaveLength(1));

    expect(result.current.savedNotes[0]?.lessonTitle).toBe("Leccion persistida");

    act(() => result.current.openEditNoteModal(result.current.savedNotes[0]));
    await act(async () => {
      await result.current.handleSaveNote({
        title: "Nota actualizada",
        content: "Contenido actualizado",
        tags: ["manual"],
      });
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/courses/curso-demo/lessons/lesson-note/notes/note-1",
      expect.objectContaining({
        body: JSON.stringify({
          note_title: "Nota actualizada",
          note_content: "Contenido actualizado",
          note_tags: ["manual"],
          source_type: "manual",
        }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      }),
    );
  });
});
