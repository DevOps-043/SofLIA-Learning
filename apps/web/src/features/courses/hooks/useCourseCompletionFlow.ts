"use client";

import { useCallback, useState } from "react";

import { handleCourseCompletedClose } from "./course-completion-flow/handleCourseCompletedClose";
import { handleCourseRatingSubmit } from "./course-completion-flow/handleCourseRatingSubmit";
import { resolveCourseCertificateRoute } from "./course-completion-flow/resolveCourseCertificateRoute";
import type { UseCourseCompletionFlowParams } from "./course-completion-flow/types";

export function useCourseCompletionFlow({
  courseId,
  enrollmentId,
  organizationId,
  courseSlug,
  onCertificateReady,
}: UseCourseCompletionFlowParams) {
  const [isCourseCompletedModalOpen, setIsCourseCompletedModalOpen] = useState(false);
  const [isCannotCompleteModalOpen, setIsCannotCompleteModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [hasUserRated, setHasUserRated] = useState(false);

  const resolveCertificateRoute = useCallback(
    () => resolveCourseCertificateRoute({ courseId, enrollmentId, organizationId }),
    [courseId, enrollmentId, organizationId]
  );

  const onCloseCourseCompleted = useCallback(
    () =>
      handleCourseCompletedClose({
        courseSlug,
        onCertificateReady,
        resolveCertificateRoute,
        setHasUserRated,
        setIsCourseCompletedModalOpen,
        setIsRatingModalOpen,
      }),
    [courseSlug, onCertificateReady, resolveCertificateRoute]
  );

  const onSubmitRating = useCallback(
    (submission) =>
      handleCourseRatingSubmit({
        courseSlug,
        onCertificateReady,
        resolveCertificateRoute,
        setHasUserRated,
        setIsRatingModalOpen,
        submission,
      }),
    [courseSlug, onCertificateReady, resolveCertificateRoute]
  );

  return {
    closeCannotCompleteModal: () => setIsCannotCompleteModalOpen(false),
    closeRatingModal: () => setIsRatingModalOpen(false),
    handleCourseCompletedClose: onCloseCourseCompleted,
    handleRatingSubmit: onSubmitRating,
    hasUserRated,
    isCannotCompleteModalOpen,
    isCourseCompletedModalOpen,
    isRatingModalOpen,
    openCannotCompleteModal: () => setIsCannotCompleteModalOpen(true),
    openCourseCompletedModal: () => setIsCourseCompletedModalOpen(true),
  };
}
