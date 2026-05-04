// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLessonNavigation } from "../useLessonNavigation";

const currentLesson = {
  lesson_id: "lesson-current",
  lesson_title: "LecciÃ³n actual",
};

const nextLesson = {
  lesson_id: "lesson-next",
  lesson_title: "LecciÃ³n siguiente",
};

const moduleData = {
  module_id: "module-1",
  module_title: "MÃ³dulo 1",
  module_order_index: 1,
  lessons: [currentLesson, nextLesson],
};

const orderedLessons = [
  { lesson: currentLesson, module: moduleData },
  { lesson: nextLesson, module: moduleData },
];

describe("useLessonNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "scrollTo", {
      value: vi.fn(),
      writable: true,
    });
  });

  it("redirects manual next navigation to activities when a required activity is pending", async () => {
    const setCurrentLesson = vi.fn();
    const setActiveTab = vi.fn();
    const markLessonAsCompleted = vi.fn().mockResolvedValue(true);
    const openValidationModal = vi.fn();
    const trackUserAction = vi.fn();

    const { result } = renderHook(() =>
      useLessonNavigation({
        orderedLessons,
        modules: [moduleData],
        currentLesson,
        lessonsActivities: {
          "lesson-current": [
            {
              activity_id: "activity-1",
              activity_title: "Actividad con SofLIA",
              activity_type: "ai_chat",
              is_required: true,
              is_completed: false,
            },
          ],
        },
        lessonsMaterials: {},
        setCurrentLesson,
        setActiveTab,
        markLessonAsCompleted,
        loadLessonActivitiesAndMaterials: vi.fn().mockResolvedValue(undefined),
        openValidationModal,
        trackUserAction,
      })
    );

    await act(async () => {
      await result.current.navigateToNextLesson();
    });

    expect(setActiveTab).toHaveBeenCalledWith("activities");
    expect(markLessonAsCompleted).not.toHaveBeenCalled();
    expect(setCurrentLesson).not.toHaveBeenCalled();
    expect(trackUserAction).toHaveBeenCalledWith(
      "redirected_to_pending_activities",
      expect.objectContaining({
        currentLessonId: "lesson-current",
        pendingCount: 1,
      })
    );
  });

  it("allows navigation when only optional activities remain pending", async () => {
    const setCurrentLesson = vi.fn();
    const setActiveTab = vi.fn();
    const markLessonAsCompleted = vi.fn().mockResolvedValue(true);
    const openValidationModal = vi.fn();

    const { result } = renderHook(() =>
      useLessonNavigation({
        orderedLessons,
        modules: [moduleData],
        currentLesson,
        lessonsActivities: {
          "lesson-current": [
            {
              activity_id: "activity-1",
              activity_title: "Actividad opcional",
              activity_type: "reflection",
              is_required: false,
              is_completed: false,
            },
          ],
        },
        lessonsMaterials: {},
        setCurrentLesson,
        setActiveTab,
        markLessonAsCompleted,
        loadLessonActivitiesAndMaterials: vi.fn().mockResolvedValue(undefined),
        openValidationModal,
        trackUserAction: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.navigateToNextLesson();
    });

    expect(markLessonAsCompleted).toHaveBeenCalledWith("lesson-current");
    expect(setCurrentLesson).toHaveBeenCalledWith(nextLesson);
    expect(setActiveTab).toHaveBeenCalledWith("video");
  });

  it("blocks next navigation while the current video is still incomplete", async () => {
    const setCurrentLesson = vi.fn();
    const setActiveTab = vi.fn();
    const markLessonAsCompleted = vi.fn().mockResolvedValue(true);
    const openValidationModal = vi.fn();
    const trackUserAction = vi.fn();

    const videoInProgressLesson = {
      ...currentLesson,
      progress_percentage: 40,
      video_provider: "direct" as const,
      video_provider_id: "video.mp4",
    };

    const { result } = renderHook(() =>
      useLessonNavigation({
        orderedLessons: [
          { lesson: videoInProgressLesson, module: moduleData },
          { lesson: nextLesson, module: moduleData },
        ],
        modules: [
          {
            ...moduleData,
            lessons: [videoInProgressLesson, nextLesson],
          },
        ],
        currentLesson: videoInProgressLesson,
        lessonsActivities: {
          "lesson-current": [],
        },
        lessonsMaterials: {},
        setCurrentLesson,
        setActiveTab,
        markLessonAsCompleted,
        loadLessonActivitiesAndMaterials: vi.fn().mockResolvedValue(undefined),
        openValidationModal,
        trackUserAction,
      })
    );

    await act(async () => {
      await result.current.navigateToNextLesson();
    });

    expect(openValidationModal).toHaveBeenCalledWith(
      expect.objectContaining({
        lessonId: "lesson-current",
        redirectTab: "video",
        type: "video",
      })
    );
    expect(markLessonAsCompleted).not.toHaveBeenCalled();
    expect(setActiveTab).not.toHaveBeenCalled();
    expect(setCurrentLesson).not.toHaveBeenCalled();
    expect(trackUserAction).toHaveBeenCalledWith(
      "attempted_next_lesson_before_video_completed",
      expect.objectContaining({
        currentLessonId: "lesson-current",
      })
    );
  });

  it("blocks forward lesson changes from the sidebar while the current video is still incomplete", async () => {
    const setCurrentLesson = vi.fn();
    const setActiveTab = vi.fn();
    const markLessonAsCompleted = vi.fn().mockResolvedValue(true);
    const openValidationModal = vi.fn();
    const trackUserAction = vi.fn();

    const videoInProgressLesson = {
      ...currentLesson,
      progress_percentage: 40,
      video_provider: "direct" as const,
      video_provider_id: "video.mp4",
    };

    const { result } = renderHook(() =>
      useLessonNavigation({
        orderedLessons: [
          { lesson: videoInProgressLesson, module: moduleData },
          { lesson: nextLesson, module: moduleData },
        ],
        modules: [
          {
            ...moduleData,
            lessons: [videoInProgressLesson, nextLesson],
          },
        ],
        currentLesson: videoInProgressLesson,
        lessonsActivities: {
          "lesson-current": [],
        },
        lessonsMaterials: {},
        setCurrentLesson,
        setActiveTab,
        markLessonAsCompleted,
        loadLessonActivitiesAndMaterials: vi.fn().mockResolvedValue(undefined),
        openValidationModal,
        trackUserAction,
      })
    );

    await act(async () => {
      await result.current.handleLessonChange(nextLesson);
    });

    expect(openValidationModal).toHaveBeenCalledWith(
      expect.objectContaining({
        lessonId: "lesson-current",
        redirectTab: "video",
        type: "video",
      })
    );
    expect(markLessonAsCompleted).not.toHaveBeenCalled();
    expect(setActiveTab).not.toHaveBeenCalled();
    expect(setCurrentLesson).not.toHaveBeenCalled();
    expect(trackUserAction).toHaveBeenCalledWith(
      "attempted_lesson_change_before_video_completed",
      expect.objectContaining({
        currentLessonId: "lesson-current",
        targetLessonId: "lesson-next",
      })
    );
  });

  it("opens and focuses a sidebar activity from the current lesson when video access is satisfied", async () => {
    const setCurrentLesson = vi.fn();
    const setActiveTab = vi.fn();
    const markLessonAsCompleted = vi.fn().mockResolvedValue(true);
    const openValidationModal = vi.fn();
    const onActivityFocus = vi.fn();
    const trackUserAction = vi.fn();

    const { result } = renderHook(() =>
      useLessonNavigation({
        orderedLessons,
        modules: [moduleData],
        currentLesson,
        lessonsActivities: {
          "lesson-current": [
            {
              activity_id: "activity-1",
              activity_title: "Actividad enfocada",
              activity_type: "exercise",
              is_required: true,
              is_completed: false,
            },
          ],
        },
        lessonsMaterials: {},
        setCurrentLesson,
        setActiveTab,
        markLessonAsCompleted,
        loadLessonActivitiesAndMaterials: vi.fn().mockResolvedValue(undefined),
        openValidationModal,
        onActivityFocus,
        trackUserAction,
      })
    );

    await act(async () => {
      await result.current.handleActivityShortcut({
        activityId: "activity-1",
        lesson: currentLesson,
      });
    });

    expect(setActiveTab).toHaveBeenCalledWith("activities");
    expect(onActivityFocus).toHaveBeenCalledWith("activity-1", "activity");
    expect(markLessonAsCompleted).not.toHaveBeenCalled();
    expect(setCurrentLesson).not.toHaveBeenCalled();
    expect(openValidationModal).not.toHaveBeenCalled();
    expect(trackUserAction).toHaveBeenCalledWith(
      "sidebar_activity_shortcut_opened",
      expect.objectContaining({
        activityId: "activity-1",
        targetLessonId: "lesson-current",
      })
    );
  });

  it("blocks sidebar activity shortcuts to future lessons while the current video is incomplete", async () => {
    const setCurrentLesson = vi.fn();
    const setActiveTab = vi.fn();
    const markLessonAsCompleted = vi.fn().mockResolvedValue(true);
    const openValidationModal = vi.fn();
    const onActivityFocus = vi.fn();
    const trackUserAction = vi.fn();

    const videoInProgressLesson = {
      ...currentLesson,
      progress_percentage: 40,
      video_provider: "direct" as const,
      video_provider_id: "video.mp4",
    };

    const { result } = renderHook(() =>
      useLessonNavigation({
        orderedLessons: [
          { lesson: videoInProgressLesson, module: moduleData },
          { lesson: nextLesson, module: moduleData },
        ],
        modules: [
          {
            ...moduleData,
            lessons: [videoInProgressLesson, nextLesson],
          },
        ],
        currentLesson: videoInProgressLesson,
        lessonsActivities: {
          "lesson-current": [],
          "lesson-next": [
            {
              activity_id: "activity-next",
              activity_title: "Actividad futura",
              activity_type: "exercise",
              is_required: true,
              is_completed: false,
            },
          ],
        },
        lessonsMaterials: {},
        setCurrentLesson,
        setActiveTab,
        markLessonAsCompleted,
        loadLessonActivitiesAndMaterials: vi.fn().mockResolvedValue(undefined),
        openValidationModal,
        onActivityFocus,
        trackUserAction,
      })
    );

    await act(async () => {
      await result.current.handleActivityShortcut({
        activityId: "activity-next",
        lesson: nextLesson,
      });
    });

    expect(openValidationModal).toHaveBeenCalledWith(
      expect.objectContaining({
        lessonId: "lesson-current",
        redirectTab: "video",
        type: "video",
      })
    );
    expect(setActiveTab).not.toHaveBeenCalled();
    expect(setCurrentLesson).not.toHaveBeenCalled();
    expect(onActivityFocus).not.toHaveBeenCalled();
    expect(markLessonAsCompleted).not.toHaveBeenCalled();
    expect(trackUserAction).toHaveBeenCalledWith(
      "attempted_activity_shortcut_before_video_completed",
      expect.objectContaining({
        activityId: "activity-next",
        currentLessonId: "lesson-current",
        targetLessonId: "lesson-next",
      })
    );
  });

  it("opens and focuses a sidebar material quiz through the same validated shortcut", async () => {
    const setCurrentLesson = vi.fn();
    const setActiveTab = vi.fn();
    const markLessonAsCompleted = vi.fn().mockResolvedValue(true);
    const openValidationModal = vi.fn();
    const onActivityFocus = vi.fn();
    const trackUserAction = vi.fn();

    const { result } = renderHook(() =>
      useLessonNavigation({
        orderedLessons,
        modules: [moduleData],
        currentLesson,
        lessonsActivities: {
          "lesson-current": [],
        },
        lessonsMaterials: {
          "lesson-current": [
            {
              material_id: "material-quiz",
              material_title: "Quiz de cierre",
              material_type: "quiz",
              is_required: true,
            },
          ],
        },
        setCurrentLesson,
        setActiveTab,
        markLessonAsCompleted,
        loadLessonActivitiesAndMaterials: vi.fn().mockResolvedValue(undefined),
        openValidationModal,
        onActivityFocus,
        trackUserAction,
      })
    );

    await act(async () => {
      await result.current.handleActivityShortcut({
        activityId: "material-quiz",
        contentType: "material",
        lesson: currentLesson,
      });
    });

    expect(setActiveTab).toHaveBeenCalledWith("activities");
    expect(onActivityFocus).toHaveBeenCalledWith("material-quiz", "material");
    expect(markLessonAsCompleted).not.toHaveBeenCalled();
    expect(openValidationModal).not.toHaveBeenCalled();
  });
});
