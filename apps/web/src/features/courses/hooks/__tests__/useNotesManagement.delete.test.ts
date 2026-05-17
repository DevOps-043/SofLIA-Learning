// @vitest-environment jsdom

import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  afterEachNotesTest,
  beforeEachNotesTest,
  createJsonResponse,
  notesStatsResponse,
  persistedNoteResponse,
  renderNotesManagement,
} from "./notes-management-hook.test-utils";

describe("useNotesManagement delete", () => {
  beforeEach(beforeEachNotesTest);
  afterEach(afterEachNotesTest);

  it("closes the note editor and removes the note after a successful delete", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/courses/curso-demo/notes") return createJsonResponse([persistedNoteResponse({ note_title: "Nota eliminable" })]);
      if (url === "/api/courses/curso-demo/notes/stats") return createJsonResponse(notesStatsResponse());
      if (url === "/api/courses/curso-demo/lessons/lesson-note/notes/note-1" && init?.method === "DELETE") return createJsonResponse({ success: true });
      throw new Error(`Unexpected fetch: ${url}`);
    });
    global.fetch = fetchMock as typeof fetch;

    const { result } = renderNotesManagement({
      currentLesson: { lesson_id: "lesson-note", lesson_title: "Leccion persistida" },
    });
    await vi.waitFor(() => expect(result.current.savedNotes).toHaveLength(1));

    act(() => {
      result.current.openEditNoteModal(result.current.savedNotes[0]);
      result.current.handleDeleteNote("note-1");
    });

    expect(result.current.isNotesModalOpen).toBe(true);
    expect(result.current.isDeleteNoteConfirmOpen).toBe(true);

    await act(async () => {
      await result.current.confirmDeleteNote();
    });

    expect(result.current.savedNotes).toHaveLength(0);
    expect(result.current.isDeleteNoteConfirmOpen).toBe(false);
    expect(result.current.isNotesModalOpen).toBe(false);
    expect(result.current.isDeletingNote).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/courses/curso-demo/lessons/lesson-note/notes/note-1",
      expect.objectContaining({ credentials: "include", method: "DELETE", signal: expect.any(AbortSignal) }),
    );
  });
});
