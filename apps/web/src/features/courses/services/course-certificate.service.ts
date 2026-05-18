import { logger as techDebtLogger } from '@/lib/utils/logger'
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export interface GenerateCourseCertificateResponse {
  success: boolean;
  message: string;
  certificate_id?: string;
  certificate_url?: string;
}

export interface GenerateCourseCertificateRequest {
  courseId: string;
  enrollmentId?: string | null;
  organizationId?: string | null;
}

const CERTIFICATE_NAVIGATION_FALLBACK_DELAY_MS = 200;

function buildCertificateErrorMessage(
  status: number,
  fallbackMessage: string
): string {
  if (status === 401) {
    return "No autorizado";
  }

  if (status === 403) {
    return fallbackMessage || "Debes calificar el curso antes de generar el certificado";
  }

  if (status === 404) {
    return fallbackMessage || "Curso no encontrado";
  }

  if (status === 400) {
    return fallbackMessage || "No se pudo generar el certificado";
  }

  return fallbackMessage || "Error al generar el certificado";
}

export class CourseCertificateService {
  static getCertificateRoute(certificateId?: string | null): string {
    return certificateId ? `/certificates/${certificateId}` : "/certificates";
  }

  private static fallbackToBrowserNavigation(route: string): void {
    if (typeof window !== "undefined") {
      window.location.assign(route);
    }
  }

  static navigateToCertificateRoute(
    route: string,
    router: Pick<AppRouterInstance, "push" | "replace">
  ): void {
    try {
      if (typeof router.replace === "function") {
        router.replace(route);
      } else if (typeof router.push === "function") {
        router.push(route);
      } else {
        CourseCertificateService.fallbackToBrowserNavigation(route);
        return;
      }
    } catch (navigationError) {
      techDebtLogger.error("Error redirecting to certificate route:", navigationError);
      CourseCertificateService.fallbackToBrowserNavigation(route);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const expectedPathname = new URL(route, window.location.origin).pathname;

    window.setTimeout(() => {
      if (window.location.pathname !== expectedPathname) {
        CourseCertificateService.fallbackToBrowserNavigation(route);
      }
    }, CERTIFICATE_NAVIGATION_FALLBACK_DELAY_MS);
  }

  static async generateCertificate(
    request: GenerateCourseCertificateRequest
  ): Promise<GenerateCourseCertificateResponse> {
    const response = await fetch("/api/certificates/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        course_id: request.courseId,
        enrollment_id: request.enrollmentId ?? undefined,
        organization_id: request.organizationId ?? undefined,
      }),
    });

    const responseData = (await response.json().catch(() => ({
      error: "Error desconocido",
    }))) as { error?: string } & Partial<GenerateCourseCertificateResponse>;

    if (!response.ok) {
      throw new Error(
        buildCertificateErrorMessage(response.status, responseData.error || "")
      );
    }

    return {
      success: Boolean(responseData.success),
      message: responseData.message || "Certificado generado exitosamente",
      certificate_id: responseData.certificate_id,
      certificate_url: responseData.certificate_url,
    };
  }
}
