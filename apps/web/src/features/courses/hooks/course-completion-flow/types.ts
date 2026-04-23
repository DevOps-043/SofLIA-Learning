import type { Dispatch, SetStateAction } from "react";

import type { CourseRatingSubmissionInput } from "../../services/course-rating.service";

export interface UseCourseCompletionFlowParams {
  courseId: string | null;
  enrollmentId: string | null;
  organizationId: string | null;
  courseSlug: string;
  onCertificateReady: (route: string) => void;
}

export type ResolveCertificateRoute = () => Promise<string>;

export type CompletionFlowStateSetters = {
  setHasUserRated: Dispatch<SetStateAction<boolean>>;
  setIsCourseCompletedModalOpen: Dispatch<SetStateAction<boolean>>;
  setIsRatingModalOpen: Dispatch<SetStateAction<boolean>>;
};

export type HandleCourseCompletedCloseParams = CompletionFlowStateSetters & {
  courseSlug: string;
  onCertificateReady: (route: string) => void;
  resolveCertificateRoute: ResolveCertificateRoute;
};

export type HandleCourseRatingSubmitParams = Omit<
  HandleCourseCompletedCloseParams,
  "setIsCourseCompletedModalOpen"
> & {
  submission: CourseRatingSubmissionInput;
};
