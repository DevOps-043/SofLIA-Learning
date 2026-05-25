import { renderHook } from "@testing-library/react";
import { vi } from "vitest";

import { useLessonNavigation } from "../useLessonNavigation";

export const currentLesson = {
  lesson_id: "lesson-current",
  lesson_title: "Leccion actual",
};

export const nextLesson = {
  lesson_id: "lesson-next",
  lesson_title: "Leccion siguiente",
};

export const moduleData = {
  module_id: "module-1",
  module_title: "Modulo 1",
  module_order_index: 1,
  lessons: [currentLesson, nextLesson],
};

export const orderedLessons = [
  { lesson: currentLesson, module: moduleData },
  { lesson: nextLesson, module: moduleData },
];

type NavigationOptions = Partial<Parameters<typeof useLessonNavigation>[0]>;

export function resetNavigationDom() {
  vi.clearAllMocks();
  Object.defineProperty(window, "scrollTo", {
    value: vi.fn(),
    writable: true,
  });
}

export function videoInProgressLesson() {
  return {
    ...currentLesson,
    progress_percentage: 40,
    video_provider: "direct" as const,
    video_provider_id: "video.mp4",
  };
}

export function videoBlockedNavigationOptions(): NavigationOptions {
  const blockedLesson = videoInProgressLesson();

  return {
    currentLesson: blockedLesson,
    lessonsActivities: { "lesson-current": [] },
    modules: [{ ...moduleData, lessons: [blockedLesson, nextLesson] }],
    orderedLessons: [
      { lesson: blockedLesson, module: moduleData },
      { lesson: nextLesson, module: moduleData },
    ],
  };
}

export function renderLessonNavigation(overrides: NavigationOptions = {}) {
  const props = {
    orderedLessons,
    modules: [moduleData],
    currentLesson,
    lessonsActivities: {},
    lessonsMaterials: {},
    setCurrentLesson: vi.fn(),
    setActiveTab: vi.fn(),
    markLessonAsCompleted: vi.fn().mockResolvedValue(true),
    loadLessonActivitiesAndMaterials: vi.fn().mockResolvedValue(undefined),
    openValidationModal: vi.fn(),
    trackUserAction: vi.fn(),
    ...overrides,
  };

  return {
    props,
    ...renderHook(() => useLessonNavigation(props)),
  };
}
