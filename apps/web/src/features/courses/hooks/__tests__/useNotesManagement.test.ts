// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useNotesManagement } from "../useNotesManagement";

function createJsonResponse(body: unknown, status: number = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("useNotesManagement", () => {
  const originalAlert = global.alert;
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    global.alert = vi.fn();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    global.alert = originalAlert;
    global.fetch = originalFetch;
  });

  it("loads course notes and enriches them with the lesson title", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse([
        {
          note_id: "note-1",
          note_title: "Transcripción",
          note_content: "Contenido de nota",
          lesson_id: "lesson-1",
          updated_at: "2026-04-09T12:00:00.000Z",
          note_tags: ["transcripción"],
        },
      ])
    );

    global.fetch = fetchMock as typeof fetch;

    const { result } = renderHook(() =>
      useNotesManagement({
        slug: "curso-demo",
        modules: [
          {
            module_id: "module-1",
            module_title: "Módulo 1",
            module_order_index: 1,
            lessons: [
              {
                lesson_id: "lesson-1",
                lesson_title: "Lección de origen",
              },
            ],
          },
        ],
        currentLesson: null,
        isNotesCollapsed: false,
        closeLia: vi.fn(),
      })
    );

    await vi.waitFor(() => {
      expect(result.current.savedNotes).toHaveLength(1);
    });

    expect(result.current.savedNotes[0]?.lessonTitle).toBe(
      "Lección de origen"
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/courses/curso-demo/notes",
      expect.objectContaining({
        cache: "no-store",
        credentials: "include",
      })
    );
  });

  it("updates a note using the persisted lessonId and keeps its lesson title", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse([
          {
            note_id: "note-1",
            note_title: "Nota previa",
            note_content: "Contenido previo",
            lesson_id: "lesson-note",
            updated_at: "2026-04-09T12:00:00.000Z",
            note_tags: ["manual"],
          },
        ])
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          note_id: "note-1",
          note_title: "Nota actualizada",
          note_content: "Contenido actualizado",
          lesson_id: "lesson-note",
          note_tags: ["manual"],
        })
      );

    global.fetch = fetchMock as typeof fetch;

    const { result } = renderHook(() =>
      useNotesManagement({
        slug: "curso-demo",
        modules: [
          {
            module_id: "module-1",
            module_title: "Módulo 1",
            module_order_index: 1,
            lessons: [
              {
                lesson_id: "lesson-note",
                lesson_title: "Lección persistida",
              },
            ],
          },
        ],
        currentLesson: {
          lesson_id: "current-lesson",
          lesson_title: "Lección actual",
        },
        isNotesCollapsed: false,
        closeLia: vi.fn(),
      })
    );

    await vi.waitFor(() => {
      expect(result.current.savedNotes).toHaveLength(1);
    });

    expect(result.current.savedNotes[0]?.lessonTitle).toBe(
      "Lección persistida"
    );

    act(() => {
      result.current.openEditNoteModal(result.current.savedNotes[0]);
    });

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
      })
    );
  });

  it("saves SofLIA drafts using the lesson where the draft was created", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/courses/curso-demo/notes") {
        return createJsonResponse([]);
      }

      if (url === "/api/courses/curso-demo/lessons/lesson-origin/notes") {
        return createJsonResponse({
          note_id: "note-lia",
          note_title: "SofLIA: LecciÃ³n de origen",
          note_content: "<p>Idea clave</p>",
          lesson_id: "lesson-origin",
          note_tags: ["SofLIA", "Clase"],
        });
      }

      if (url === "/api/courses/curso-demo/notes/stats") {
        return createJsonResponse({
          totalNotes: 1,
          lessonsWithNotes: 1,
          totalLessons: 2,
          lastUpdate: "2026-04-09T12:00:00.000Z",
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    global.fetch = fetchMock as typeof fetch;

    const { result } = renderHook(
      ({
        currentLesson,
      }: {
        currentLesson: { lesson_id: string; lesson_title: string };
      }) =>
        useNotesManagement({
          slug: "curso-demo",
          modules: [
            {
              module_id: "module-1",
              module_title: "MÃ³dulo 1",
              module_order_index: 1,
              lessons: [
                {
                  lesson_id: "lesson-origin",
                  lesson_title: "LecciÃ³n de origen",
                },
                {
                  lesson_id: "lesson-next",
                  lesson_title: "LecciÃ³n siguiente",
                },
              ],
            },
          ],
          currentLesson,
          isNotesCollapsed: false,
          closeLia: vi.fn(),
        }),
      {
        initialProps: {
          currentLesson: {
            lesson_id: "lesson-origin",
            lesson_title: "LecciÃ³n de origen",
          },
        },
      }
    );

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    act(() => {
      result.current.openLiaNoteModal("<p>Idea clave</p>");
    });

    expect(result.current.editingNote).toMatchObject({
      lessonId: "lesson-origin",
      title: "SofLIA: LecciÃ³n de origen",
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
          note_title: "SofLIA: LecciÃ³n de origen",
          note_content: "<p>Idea clave</p>",
          note_tags: ["SofLIA", "Clase"],
          source_type: "manual",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
    );
  });

  it("closes the note editor and removes the note after a successful delete", async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url === "/api/courses/curso-demo/notes") {
          return createJsonResponse([
            {
              note_id: "note-1",
              note_title: "Nota eliminable",
              note_content: "<p>Contenido</p>",
              lesson_id: "lesson-note",
              updated_at: "2026-04-09T12:00:00.000Z",
              note_tags: ["manual"],
            },
          ]);
        }

        if (
          url === "/api/courses/curso-demo/lessons/lesson-note/notes/note-1" &&
          init?.method === "DELETE"
        ) {
          return createJsonResponse({ success: true });
        }

        if (url === "/api/courses/curso-demo/notes/stats") {
          return createJsonResponse({
            totalNotes: 0,
            lessonsWithNotes: 0,
            totalLessons: 1,
            lastUpdate: null,
          });
        }

        throw new Error(`Unexpected fetch: ${url}`);
      }
    );

    global.fetch = fetchMock as typeof fetch;

    const { result } = renderHook(() =>
      useNotesManagement({
        slug: "curso-demo",
        modules: [
          {
            module_id: "module-1",
            module_title: "MÃ³dulo 1",
            module_order_index: 1,
            lessons: [
              {
                lesson_id: "lesson-note",
                lesson_title: "LecciÃ³n persistida",
              },
            ],
          },
        ],
        currentLesson: {
          lesson_id: "lesson-note",
          lesson_title: "LecciÃ³n persistida",
        },
        isNotesCollapsed: false,
        closeLia: vi.fn(),
      })
    );

    await vi.waitFor(() => {
      expect(result.current.savedNotes).toHaveLength(1);
    });

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
      expect.objectContaining({
        credentials: "include",
        method: "DELETE",
        signal: expect.any(AbortSignal),
      })
    );
  });

  it("resets the delete state when the delete request times out", async () => {
    const fetchMock = vi.fn(
      (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url === "/api/courses/curso-demo/notes") {
          return Promise.resolve(
            createJsonResponse([
              {
                note_id: "note-1",
                note_title: "Nota eliminable",
                note_content: "<p>Contenido</p>",
                lesson_id: "lesson-note",
                updated_at: "2026-04-09T12:00:00.000Z",
                note_tags: ["manual"],
              },
            ])
          );
        }

        if (url === "/api/courses/curso-demo/notes/stats") {
          return Promise.resolve(
            createJsonResponse({
              totalNotes: 0,
              lessonsWithNotes: 0,
              totalLessons: 1,
              lastUpdate: null,
            })
          );
        }

        if (
          url === "/api/courses/curso-demo/lessons/lesson-note/notes/note-1" &&
          init?.method === "DELETE"
        ) {
          return new Promise<Response>((_, reject) => {
            init.signal?.addEventListener("abort", () => {
              reject(new DOMException("Aborted", "AbortError"));
            });
          });
        }

        throw new Error(`Unexpected fetch: ${url}`);
      }
    );

    global.fetch = fetchMock as typeof fetch;

    const { result } = renderHook(() =>
      useNotesManagement({
        slug: "curso-demo",
        modules: [
          {
            module_id: "module-1",
            module_title: "MÃ³dulo 1",
            module_order_index: 1,
            lessons: [
              {
                lesson_id: "lesson-note",
                lesson_title: "LecciÃ³n persistida",
              },
            ],
          },
        ],
        currentLesson: {
          lesson_id: "lesson-note",
          lesson_title: "LecciÃ³n persistida",
        },
        isNotesCollapsed: false,
        closeLia: vi.fn(),
      })
    );

    await vi.waitFor(() => {
      expect(result.current.savedNotes).toHaveLength(1);
    });

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
    expect(result.current.noteError).toBe(
      "La eliminacion de la nota tardó demasiado. Intenta de nuevo."
    );
  });
});
