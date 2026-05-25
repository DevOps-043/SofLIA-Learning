// @vitest-environment jsdom

import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  nextLesson,
  renderLessonNavigation,
  resetNavigationDom,
  videoBlockedNavigationOptions,
} from "./lesson-navigation-hook.test-utils";

describe("useLessonNavigation video completion blocking", () => {
  beforeEach(resetNavigationDom);

  it("blocks next navigation while the current video is still incomplete", async () => {
    const { props, result } = renderLessonNavigation(videoBlockedNavigationOptions());

    await act(async () => {
      await result.current.navigateToNextLesson();
    });

    expect(props.openValidationModal).toHaveBeenCalledWith(
      expect.objectContaining({ lessonId: "lesson-current", redirectTab: "video", type: "video" }),
    );
    expect(props.markLessonAsCompleted).not.toHaveBeenCalled();
    expect(props.setActiveTab).not.toHaveBeenCalled();
    expect(props.setCurrentLesson).not.toHaveBeenCalled();
    expect(props.trackUserAction).toHaveBeenCalledWith(
      "attempted_next_lesson_before_video_completed",
      expect.objectContaining({ currentLessonId: "lesson-current" }),
    );
  });

  it("blocks forward lesson changes from the sidebar while the current video is incomplete", async () => {
    const { props, result } = renderLessonNavigation(videoBlockedNavigationOptions());

    await act(async () => {
      await result.current.handleLessonChange(nextLesson);
    });

    expect(props.openValidationModal).toHaveBeenCalledWith(
      expect.objectContaining({ lessonId: "lesson-current", redirectTab: "video", type: "video" }),
    );
    expect(props.markLessonAsCompleted).not.toHaveBeenCalled();
    expect(props.setActiveTab).not.toHaveBeenCalled();
    expect(props.setCurrentLesson).not.toHaveBeenCalled();
    expect(props.trackUserAction).toHaveBeenCalledWith(
      "attempted_lesson_change_before_video_completed",
      expect.objectContaining({ currentLessonId: "lesson-current", targetLessonId: "lesson-next" }),
    );
  });
});
