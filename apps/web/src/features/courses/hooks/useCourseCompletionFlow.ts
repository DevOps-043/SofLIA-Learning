"use client";

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useCallback, useState } from "react";

import { CourseCertificateService } from "../services/course-certificate.service";
import {
  CourseRatingService,
  type CourseRatingSubmissionInput,
} from "../services/course-rating.service";

interface UseCourseCompletionFlowParams {
  courseId: string | null;
  enrollmentId: string | null;
  organizationId: string | null;
  courseSlug: string;
  onCertificateReady: (route: string) => void;
}

export function useCourseCompletionFlow({
  courseId,
  enrollmentId,
  organizationId,
  courseSlug,
  onCertificateReady,
}: UseCourseCompletionFlowParams) {
  const [isCourseCompletedModalOpen, setIsCourseCompletedModalOpen] =
    useState(false);
  const [isCannotCompleteModalOpen, setIsCannotCompleteModalOpen] =
    useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [hasUserRated, setHasUserRated] = useState(false);

  const resolveCertificateRoute = useCallback(async () => {
    if (!courseId) {
      throw new Error(
        "No se pudo identificar el curso para generar el certificado"
      );
    }

    const certificate = await CourseCertificateService.generateCertificate({
      courseId,
      enrollmentId,
      organizationId,
    });

    return CourseCertificateService.getCertificateRoute(
      certificate.certificate_id
    );
  }, [courseId, enrollmentId, organizationId]);

  const openCourseCompletedModal = useCallback(() => {
    setIsCourseCompletedModalOpen(true);
  }, []);

  const openCannotCompleteModal = useCallback(() => {
    setIsCannotCompleteModalOpen(true);
  }, []);

  const closeCannotCompleteModal = useCallback(() => {
    setIsCannotCompleteModalOpen(false);
  }, []);

  const closeRatingModal = useCallback(() => {
    setIsRatingModalOpen(false);
  }, []);

  const handleCourseCompletedClose = useCallback(async () => {
    setIsCourseCompletedModalOpen(false);

    let hasExistingRating = false;

    try {
      const ratingCheck = await CourseRatingService.checkUserRating(courseSlug);

      if (!ratingCheck.hasRating) {
        setIsRatingModalOpen(true);
        return;
      }

      hasExistingRating = true;
      setHasUserRated(true);
    } catch (error) {
      techDebtLogger.error("Error checking rating:", error);
      setIsRatingModalOpen(true);
      return;
    }

    try {
      const certificateRoute = await resolveCertificateRoute();
      onCertificateReady(certificateRoute);
    } catch (error) {
      techDebtLogger.error("Error generating certificate:", error);

      if (!hasExistingRating) {
        setIsRatingModalOpen(true);
      }
    }
  }, [courseSlug, onCertificateReady, resolveCertificateRoute]);

  const handleRatingSubmit = useCallback(
    async (submission: CourseRatingSubmissionInput) => {
      await CourseRatingService.submitRating(courseSlug, submission);

      setHasUserRated(true);

      const certificateRoute = await resolveCertificateRoute();
      setIsRatingModalOpen(false);
      onCertificateReady(certificateRoute);
    },
    [courseSlug, onCertificateReady, resolveCertificateRoute]
  );

  return {
    closeCannotCompleteModal,
    closeRatingModal,
    handleCourseCompletedClose,
    handleRatingSubmit,
    hasUserRated,
    isCannotCompleteModalOpen,
    isCourseCompletedModalOpen,
    isRatingModalOpen,
    openCannotCompleteModal,
    openCourseCompletedModal,
  };
}
