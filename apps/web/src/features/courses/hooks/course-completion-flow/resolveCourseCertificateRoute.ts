import { CourseCertificateService } from "../../services/course-certificate.service";

type ResolveCourseCertificateRouteParams = {
  courseId: string | null;
  enrollmentId: string | null;
  organizationId: string | null;
};

export async function resolveCourseCertificateRoute({
  courseId,
  enrollmentId,
  organizationId,
}: ResolveCourseCertificateRouteParams) {
  if (!courseId) {
    throw new Error("No se pudo identificar el curso para generar el certificado");
  }

  const certificate = await CourseCertificateService.generateCertificate(
    enrollmentId || organizationId
      ? { courseId, enrollmentId, organizationId }
      : courseId
  );

  return CourseCertificateService.getCertificateRoute(certificate.certificate_id);
}
