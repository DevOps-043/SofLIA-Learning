import { CourseRatingService } from "../../services/course-rating.service";
import type { HandleCourseRatingSubmitParams } from "./types";

export async function handleCourseRatingSubmit({
  courseSlug,
  onCertificateReady,
  resolveCertificateRoute,
  setHasUserRated,
  setIsRatingModalOpen,
  submission,
}: HandleCourseRatingSubmitParams) {
  await CourseRatingService.submitRating(courseSlug, submission);
  setHasUserRated(true);
  onCertificateReady(await resolveCertificateRoute());
  setIsRatingModalOpen(false);
}
