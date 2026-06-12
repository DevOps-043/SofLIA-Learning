"use client";

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrentOrganizationId } from "@/core/stores/organizationStore";
import { checkLessonQuizStatus } from "./useLessonCompletion/quiz-status";
import type {
  UseLessonCompletionParams,
  ValidationModalState,
} from "./useLessonCompletion/types";
import { useLessonCompletionWorkflow } from "./useLessonCompletion/useLessonCompletionWorkflow";

export type { ValidationModalState } from "./useLessonCompletion/types";

export function useLessonCompletion(params: UseLessonCompletionParams) {
  const { t } = useTranslation("learn");
  const currentOrganizationId = useCurrentOrganizationId();
  const organizationId = params.organizationId === undefined
    ? currentOrganizationId
    : params.organizationId;
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

  const checkQuizStatus = useCallback(
    (lessonId: string, signal?: AbortSignal) =>
      checkLessonQuizStatus({
        slug: params.slug,
        lessonId,
        organizationId,
        signal,
        t,
      }),
    [organizationId, params.slug, t]
  );

  const markLessonAsCompleted = useLessonCompletionWorkflow({
    ...params,
    organizationId,
    t,
    openValidationModal,
  });

  return {
    checkQuizStatus,
    markLessonAsCompleted,
    openValidationModal,
    validationModal,
    setValidationModal,
  };
}
