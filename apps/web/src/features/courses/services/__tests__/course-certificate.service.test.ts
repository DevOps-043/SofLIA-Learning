// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CourseCertificateService } from "../course-certificate.service";

type CourseCertificateServiceInternals = typeof CourseCertificateService & {
  fallbackToBrowserNavigation: (route: string) => void;
};

describe("CourseCertificateService.navigateToCertificateRoute", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    window.history.replaceState({}, "", "/courses/course-1/learn");
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("uses router.replace for in-app certificate navigation", () => {
    const replace = vi.fn();
    const push = vi.fn();
    const fallbackSpy = vi
      .spyOn(
        CourseCertificateService as CourseCertificateServiceInternals,
        "fallbackToBrowserNavigation"
      )
      .mockImplementation(() => undefined);

    CourseCertificateService.navigateToCertificateRoute("/certificates/cert-1", {
      push,
      replace,
    });

    window.history.replaceState({}, "", "/certificates/cert-1");
    vi.runOnlyPendingTimers();

    expect(replace).toHaveBeenCalledWith("/certificates/cert-1");
    expect(push).not.toHaveBeenCalled();
    expect(fallbackSpy).not.toHaveBeenCalled();
  });

  it("falls back to browser navigation when router navigation throws", () => {
    const replace = vi.fn(() => {
      throw new Error("router replace failed");
    });
    const push = vi.fn();
    const fallbackSpy = vi
      .spyOn(
        CourseCertificateService as CourseCertificateServiceInternals,
        "fallbackToBrowserNavigation"
      )
      .mockImplementation(() => undefined);

    CourseCertificateService.navigateToCertificateRoute("/certificates", {
      push,
      replace,
    });

    expect(replace).toHaveBeenCalledWith("/certificates");
    expect(fallbackSpy).toHaveBeenCalledWith("/certificates");
  });

  it("sends the enrollment and organization context when generating a certificate", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: "Certificado generado exitosamente",
        certificate_id: "cert-1",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await CourseCertificateService.generateCertificate({
      courseId: "course-1",
      enrollmentId: "enrollment-1",
      organizationId: "org-1",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/certificates/generate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          course_id: "course-1",
          enrollment_id: "enrollment-1",
          organization_id: "org-1",
        }),
      })
    );
  });
});
