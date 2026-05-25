// @vitest-environment jsdom

import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  currentLesson,
  nextLesson,
  renderLessonNavigation,
  resetNavigationDom,
  videoBlockedNavigationOptions,
} from "./lesson-navigation-hook.test-utils";

describe("useLessonNavigation sidebar shortcuts", () => {
  beforeEach(resetNavigationDom);

  it("opens and focuses a sidebar activity from the current lesson when video access is satisfied", async () => {
    const onActivityFocus = vi.fn();
    const { props, result } = renderLessonNavigation({
      lessonsActivities: {
        "lesson-current": [
          { activity_id: "activity-1", activity_title: "Actividad enfocada", activity_type: "exercise", is_required: true, is_completed: false },
        ],
      },
      onActivityFocus,
    });

    await act(async () => {
      await result.current.handleActivityShortcut({ activityId: "activity-1", lesson: currentLesson });
    });

    expect(props.setActiveTab).toHaveBeenCalledWith("activities");
    expect(onActivityFocus).toHaveBeenCalledWith("activity-1", "activity");
    expect(props.markLessonAsCompleted).not.toHaveBeenCalled();
    expect(props.setCurrentLesson).not.toHaveBeenCalled();
    expect(props.openValidationModal).not.toHaveBeenCalled();
  });

  it("blocks sidebar activity shortcuts to future lessons while the current video is incomplete", async () => {
    const onActivityFocus = vi.fn();
    const { props, result } = renderLessonNavigation({
      ...videoBlockedNavigationOptions(),
      lessonsActivities: {
        "lesson-current": [],
        "lesson-next": [
          { activity_id: "activity-next", activity_title: "Actividad futura", activity_type: "exercise", is_required: true, is_completed: false },
        ],
      },
      onActivityFocus,
    });

    await act(async () => {
      await result.current.handleActivityShortcut({ activityId: "activity-next", lesson: nextLesson });
    });

    expect(props.openValidationModal).toHaveBeenCalledWith(
      expect.objectContaining({ lessonId: "lesson-current", redirectTab: "video", type: "video" }),
    );
    expect(props.setActiveTab).not.toHaveBeenCalled();
    expect(props.setCurrentLesson).not.toHaveBeenCalled();
    expect(onActivityFocus).not.toHaveBeenCalled();
    expect(props.markLessonAsCompleted).not.toHaveBeenCalled();
  });

  it("opens and focuses a sidebar material quiz through the same validated shortcut", async () => {
    const onActivityFocus = vi.fn();
    const { props, result } = renderLessonNavigation({
      lessonsActivities: { "lesson-current": [] },
      lessonsMaterials: {
        "lesson-current": [{ material_id: "material-quiz", material_title: "Quiz de cierre", material_type: "quiz", is_required: true }],
      },
      onActivityFocus,
    });

    await act(async () => {
      await result.current.handleActivityShortcut({ activityId: "material-quiz", contentType: "material", lesson: currentLesson });
    });

    expect(props.setActiveTab).toHaveBeenCalledWith("activities");
    expect(onActivityFocus).toHaveBeenCalledWith("material-quiz", "material");
    expect(props.markLessonAsCompleted).not.toHaveBeenCalled();
    expect(props.openValidationModal).not.toHaveBeenCalled();
  });
});
