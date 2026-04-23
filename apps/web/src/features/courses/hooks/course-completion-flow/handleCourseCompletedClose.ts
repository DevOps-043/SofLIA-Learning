import { CourseRatingService } from "../../services/course-rating.service";
import type { HandleCourseCompletedCloseParams } from "./types";

export async function handleCourseCompletedClose({
  courseSlug,
  onCertificateReady,
  resolveCertificateRoute,
  setHasUserRated,
  setIsCourseCompletedModalOpen,
  setIsRatingModalOpen,
}: HandleCourseCompletedCloseParams) {
  setIsCourseCompletedModalOpen(false);

  try {
    const ratingCheck = await CourseRatingService.checkUserRating(courseSlug);
    if (!ratingCheck.hasRating) {
      setIsRatingModalOpen(true);
      return;
    }

    setHasUserRated(true);
  } catch (error) {
    console.error("Error checking rating:", error);
    setIsRatingModalOpen(true);
    return;
  }

  try {
    onCertificateReady(await resolveCertificateRoute());
  } catch (error) {
    console.error("Error generating certificate:", error);
  }
}
