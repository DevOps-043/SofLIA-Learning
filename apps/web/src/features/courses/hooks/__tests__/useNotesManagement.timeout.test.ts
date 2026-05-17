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

describe("useNotesManagement delete timeout", () => {
  beforeEach(beforeEachNotesTest);
  afterEach(afterEachNotesTest);

  it("resets the delete state when the delete request times out", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "/api/courses/curso-demo/notes") return Promise.resolve(createJsonResponse([persistedNoteResponse({ note_title: "Nota eliminable" })]));
      if (url === "/api/courses/curso-demo/notes/stats") return Promise.resolve(createJsonResponse(notesStatsResponse()));
      if (url === "/api/courses/curso-demo/lessons/lesson-note/notes/note-1" && init?.method === "DELETE") {
        return new Promise<Response>((_, reject) => {
          init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        });
      }
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

    await act(async () => {
      const deletionPromise = result.current.confirmDeleteNote();
      await vi.advanceTimersByTimeAsync(20000);
      await deletionPromise;
    });

    expect(result.current.isDeletingNote).toBe(false);
    expect(result.current.isDeleteNoteConfirmOpen).toBe(false);
    expect(result.current.noteError).toContain("tard");
  });
});
