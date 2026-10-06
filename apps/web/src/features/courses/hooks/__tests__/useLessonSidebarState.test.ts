// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useLessonSidebarState } from "../useLessonSidebarState";
import { clearDeduplicationCache } from "@/lib/supabase/request-deduplication";

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
    clearDeduplicationCache();
    global.fetch = originalFetch;
  });

  it('does not reuse content from another course or accept its delayed response', async () => {
    let resolveOld!: (response: Response) => void;
    global.fetch = vi.fn()
      .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }))
      .mockResolvedValueOnce(createJsonResponse({ activities: [{ activity_id: 'new', activity_title: 'New', activity_type: 'quiz' }], materials: [] }));
    const { result, rerender } = renderHook(({ slug }) => useLessonSidebarState({
      slug, selectedLang: 'es', modules: [],
      currentLesson: { lesson_id: 'lesson', lesson_title: 'Lesson' }, isMobile: false,
    }), { initialProps: { slug: 'old-course' } });
    rerender({ slug: 'new-course' });
    await waitFor(() => expect(result.current.lessonsActivities.lesson?.[0]?.activity_id).toBe('new'));
    await act(async () => resolveOld(createJsonResponse({ activities: [{ activity_id: 'old' }] })));
    expect(result.current.lessonsActivities.lesson?.[0]?.activity_id).toBe('new');
  });

  it('preserves known activities when a refresh fails', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(createJsonResponse({
      activities: [{ activity_id: 'quiz', activity_title: 'Quiz', activity_type: 'quiz' }], materials: [],
    })).mockResolvedValueOnce(createJsonResponse({}, 503));
    const { result } = renderHook(() => useLessonSidebarState({
      slug: 'course', selectedLang: 'es', modules: [],
      currentLesson: { lesson_id: 'lesson', lesson_title: 'Lesson' }, isMobile: false,
    }));
    await waitFor(() => expect(result.current.lessonsActivities.lesson).toHaveLength(1));
    await act(async () => { await result.current.loadLessonActivitiesAndMaterials('lesson', true); });
    expect(result.current.lessonsActivities.lesson?.[0]?.activity_id).toBe('quiz');
  });

  it('does not overwrite a refreshed quiz with an older in-flight response', async () => {
    let finishOld!: (response: Response) => void;
    global.fetch = vi.fn()
      .mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }))
      .mockResolvedValueOnce(createJsonResponse({ activities: [{ activity_id: 'fresh', activity_type: 'quiz' }], materials: [] }));
    const { result } = renderHook(() => useLessonSidebarState({
      slug: 'course', selectedLang: 'es', modules: [],
      currentLesson: { lesson_id: 'lesson', lesson_title: 'Lesson' }, isMobile: false,
    }));
    await act(async () => { await result.current.loadLessonActivitiesAndMaterials('lesson', true); });
    await act(async () => finishOld(createJsonResponse({ activities: [{ activity_id: 'old', activity_type: 'quiz' }], materials: [] })));
    expect(result.current.lessonsActivities.lesson?.[0]?.activity_id).toBe('fresh');
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
