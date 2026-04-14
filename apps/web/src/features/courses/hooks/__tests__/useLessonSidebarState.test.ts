// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useLessonSidebarState } from "../useLessonSidebarState";

function createJsonResponse(body: unknown, status: number = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("useLessonSidebarState", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("loads sidebar data for the current lesson on mount", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        activities: [
          {
            activity_id: "activity-1",
            activity_title: "Actividad con SofLIA",
            activity_type: "ai_chat",
            is_required: true,
            is_completed: false,
          },
        ],
        materials: [],
        quizStatus: null,
      })
    );

    global.fetch = fetchMock as typeof fetch;

    const { result } = renderHook(() =>
      useLessonSidebarState({
        slug: "curso-demo",
        selectedLang: "es",
        modules: [
          {
            module_id: "module-1",
            module_title: "Módulo 1",
            module_order_index: 1,
            lessons: [
              {
                lesson_id: "lesson-1",
                lesson_title: "Lección actual",
              },
            ],
          },
        ],
        currentLesson: {
          lesson_id: "lesson-1",
          lesson_title: "Lección actual",
        },
        isMobile: false,
      })
    );

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/courses/curso-demo/lessons/lesson-1/sidebar-data?language=es",
        { credentials: "include" }
      );
    });

    await vi.waitFor(() => {
      expect(result.current.lessonsActivities["lesson-1"]).toEqual([
        {
          activity_id: "activity-1",
          activity_title: "Actividad con SofLIA",
          activity_type: "ai_chat",
          is_required: true,
          is_completed: false,
        },
      ]);
    });
  });
});
