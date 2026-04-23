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

// Gives the router enough time to initiate navigation before checking if it succeeded.
// 200 ms covers typical Next.js router push latency without being perceptible to users.
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

function fallbackToBrowserNavigation(route: string): void {
  if (typeof window !== "undefined") {
    window.location.assign(route);
  }
}

/**
 * Client-side service for certificate generation and navigation.
 * All methods are stateless — no class instantiation needed.
 */
export const CourseCertificateService = {
  getCertificateRoute(certificateId?: string | null): string {
    return certificateId ? `/certificates/${certificateId}` : "/certificates";
  },

  navigateToCertificateRoute(
    route: string,
    router: Pick<AppRouterInstance, "push" | "replace">
  ): void {
    try {
      if (typeof router.replace === "function") {
        router.replace(route);
      } else if (typeof router.push === "function") {
        router.push(route);
      } else {
        fallbackToBrowserNavigation(route);
        return;
      }
    } catch (navigationError) {
      console.error("Error redirecting to certificate route:", navigationError);
      fallbackToBrowserNavigation(route);
      return;
    }

    if (typeof window === "undefined") return;

    const expectedPathname = new URL(route, window.location.origin).pathname;
    window.setTimeout(() => {
      if (window.location.pathname !== expectedPathname) {
        fallbackToBrowserNavigation(route);
      }
    }, CERTIFICATE_NAVIGATION_FALLBACK_DELAY_MS);
  },

  /**
   * @param request - Accepts a full request object or a bare courseId string (legacy shorthand).
   */
  async generateCertificate(
    request: GenerateCourseCertificateRequest | string
  ): Promise<GenerateCourseCertificateResponse> {
    const normalizedRequest =
      typeof request === "string" ? { courseId: request } : request;

    const response = await fetch("/api/certificates/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        course_id: normalizedRequest.courseId,
        enrollment_id: normalizedRequest.enrollmentId ?? undefined,
        organization_id: normalizedRequest.organizationId ?? undefined,
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
  },
} as const
