// @vitest-environment jsdom

import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  currentLesson,
  nextLesson,
  renderLessonNavigation,
  resetNavigationDom,
} from "./lesson-navigation-hook.test-utils";

describe("useLessonNavigation next navigation", () => {
  beforeEach(resetNavigationDom);

  it("redirects manual next navigation to activities when a required activity is pending", async () => {
    const { props, result } = renderLessonNavigation({
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
    });

    await act(async () => {
      await result.current.navigateToNextLesson();
    });

    expect(props.setActiveTab).toHaveBeenCalledWith("activities");
    expect(props.markLessonAsCompleted).not.toHaveBeenCalled();
    expect(props.setCurrentLesson).not.toHaveBeenCalled();
    expect(props.trackUserAction).toHaveBeenCalledWith(
      "redirected_to_pending_activities",
      expect.objectContaining({ currentLessonId: currentLesson.lesson_id, pendingCount: 1 }),
    );
  });

  it("allows navigation when only optional activities remain pending", async () => {
    const { props, result } = renderLessonNavigation({
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
    });

    await act(async () => {
      await result.current.navigateToNextLesson();
    });

    expect(props.markLessonAsCompleted).toHaveBeenCalledWith("lesson-current");
    expect(props.setCurrentLesson).toHaveBeenCalledWith(nextLesson);
    expect(props.setActiveTab).toHaveBeenCalledWith("video");
  });
});
