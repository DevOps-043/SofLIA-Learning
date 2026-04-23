"use client";

import { useCallback, useState } from "react";

import { useCurrentOrganizationId } from "@/core/stores/organizationStore";
import { useMarkLessonCompleted } from "./lesson-completion/useMarkLessonCompleted";
import { useQuizStatus } from "./lesson-completion/useQuizStatus";
import type {
  UseLessonCompletionParams,
  ValidationModalState,
} from "./lesson-completion/types";

/**
 * Manages the lesson completion flow for the learning page.
 *
 * Orchestrates:
 * - `useQuizStatus` — checks whether the current lesson has a pending quiz
 * - `useMarkLessonCompleted` — handles the full completion sequence:
 *     quiz gate → progress save → module/course progress update
 * - `validationModal` — inline UI state for the "complete lesson" prompt
 *
 * Side effects: mutates `modules`, `currentLesson`, and `courseProgress`
 * via the provided setters when a lesson is successfully completed.
 *
 * @param params.canCompleteLesson - External guard; if false, completion is blocked.
 */
export function useLessonCompletion({
  slug,
  currentLesson,
  setModules,
  setCurrentLesson,
  setCourseProgress,
  canCompleteLesson,
}: UseLessonCompletionParams) {
  const organizationId = useCurrentOrganizationId();
  const [validationModal, setValidationModal] = useState<ValidationModalState>({
    isOpen: false,
    title: "",
    message: "",
    type: "activity",
    lessonId: undefined,
    redirectTab: undefined,
  });

  const openValidationModal = useCallback(
    (modal: Omit<ValidationModalState, "isOpen">) => {
      setValidationModal({ ...modal, isOpen: true });
    },
    []
  );

  const checkQuizStatus = useQuizStatus({ organizationId, slug });
  const markLessonAsCompleted = useMarkLessonCompleted({
    canCompleteLesson,
    checkQuizStatus,
    currentLesson,
    openValidationModal,
    organizationId,
    setCourseProgress,
    setCurrentLesson,
    setModules,
    slug,
  });

  return {
    checkQuizStatus,
    markLessonAsCompleted,
    openValidationModal,
    validationModal,
    setValidationModal,
  };
}
