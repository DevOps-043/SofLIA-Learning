// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildHubSessionLink } from "../hub-link";
import {
  getHubSessionAccess,
  isZoomAccessUrl,
} from "../services/hub-access.service";
import { zoomRequest } from "../zoom.server";
import type { LiveContext } from "../server";
import type { LiveSession } from "../types";

vi.mock("../zoom.server", () => ({ zoomRequest: vi.fn() }));
const id = "00000000-0000-4000-8000-000000000031";
const session = {
  id,
  instructor_id: "teacher",
  status: "live",
  zoom_meeting_id: "123",
  title: "Clase",
  starts_at: "2026-10-10T20:00:00Z",
} as LiveSession;
function context(userId: string, teacher = false): LiveContext {
  return {
    userId,
    canTeach: teacher,
    instructor: teacher ? { zoom_user_id: "host" } : null,
    db: {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { host_id: "host" }, error: null }),
          }),
        }),
      }),
    },
  } as unknown as LiveContext;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("ZOOM_ACCOUNT_ID", "master-account");
});
afterEach(() => vi.unstubAllEnvs());
describe("Acceso de Learning a Hub", () => {
  it("el deep link lleva solo la referencia y rechaza slugs manipulados", () => {
    const url = new URL(buildHubSessionLink("acme", id));
    expect(url.protocol).toBe("soflia:");
    expect([...url.searchParams.keys()]).toEqual([
      "organization_slug",
      "session_id",
    ]);
    expect(() => buildHubSessionLink("acme&role=host", id)).toThrow();
  });
  it.each([
    "https://zoom.us.evil.test/j/123",
    "http://zoom.us/j/123",
    "https://user@zoom.us/j/123",
    "javascript:alert(1)",
    "https://zoom.us:8443/j/123",
  ])("rechaza destino %s", (url) => expect(isZoomAccessUrl(url)).toBe(false));
  it("un administrador que supervisa recibe acceso de participante", async () => {
    vi.mocked(zoomRequest).mockResolvedValue({
      join_url: "https://zoom.us/j/123",
      start_url: "https://zoom.us/s/123?zak=host-only",
      host_id: "host",
    });
    const result = await getHubSessionAccess(context("admin"), session, true);
    expect(result.role).toBe("participant");
    expect(result.join_url).toBe("https://zoom.us/j/123");
  });
  it("el instructor vinculado recibe el inicio del anfitrión de la cuenta maestra aunque sus correos difieran", async () => {
    vi.mocked(zoomRequest)
      .mockResolvedValueOnce({
        host_id: "host",
        start_url: "https://zoom.us/s/123?zak=host-only",
      })
      .mockResolvedValueOnce({
        id: "host",
        email: "master@example.test",
        status: "active",
        account_id: "master-account",
      });
    expect(
      (await getHubSessionAccess(context("teacher", true), session, true)).role,
    ).toBe("host");
  });
  it.each([
    { id: "host", status: "active", account_id: "other-account" },
    { id: "host", status: "inactive", account_id: "master-account" },
    { id: "other-host", status: "active", account_id: "master-account" },
    { id: "host", status: "active" },
  ])(
    "rechaza anfitrión inactivo, de otra cuenta o con identidad distinta: %j",
    async (zoomHost) => {
      vi.mocked(zoomRequest)
        .mockResolvedValueOnce({
          host_id: "host",
          start_url: "https://zoom.us/s/123?zak=host-only",
        })
        .mockResolvedValueOnce(zoomHost);
      await expect(
        getHubSessionAccess(context("teacher", true), session, true),
      ).rejects.toMatchObject({ status: 403 });
    },
  );
  it("revincular al docente no entrega el inicio de una sesión creada con otro anfitrión", async () => {
    const actor = context("teacher", true);
    actor.instructor!.zoom_user_id = "new-host";
    vi.mocked(zoomRequest).mockResolvedValueOnce({
      host_id: "new-host",
      start_url: "https://zoom.us/s/123?zak=host-only",
    });
    await expect(
      getHubSessionAccess(actor, session, true),
    ).rejects.toMatchObject({ status: 403 });
    expect(zoomRequest).toHaveBeenCalledTimes(1);
  });
  it("rechaza un anfitrión Zoom que pertenece a otra persona", async () => {
    vi.mocked(zoomRequest)
      .mockResolvedValueOnce({
        host_id: "other",
        start_url: "https://zoom.us/s/123",
      })
      .mockResolvedValueOnce({ email: "other@example.test", status: "active" });
    await expect(
      getHubSessionAccess(context("teacher", true), session, true),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("al retirar la capacidad docente ya no entrega acceso de host", async () => {
    vi.mocked(zoomRequest).mockResolvedValue({
      join_url: "https://zoom.us/j/123",
    });
    expect(
      (await getHubSessionAccess(context("teacher"), session, true)).role,
    ).toBe("participant");
  });
  it.each(["ended", "cancelled"])(
    "no consulta Zoom para una sesión %s",
    async (status) => {
      await expect(
        getHubSessionAccess(
          context("student"),
          { ...session, status } as LiveSession,
          false,
        ),
      ).rejects.toMatchObject({ status: 409 });
      expect(zoomRequest).not.toHaveBeenCalled();
    },
  );
  it("resuelve webinars con su recurso propio", async () => {
    vi.mocked(zoomRequest).mockResolvedValue({
      join_url: "https://zoom.us/w/456",
    });
    await getHubSessionAccess(
      context("student"),
      { ...session, session_type: "webinar", zoom_webinar_id: "456" },
      false,
    );
    expect(zoomRequest).toHaveBeenCalledWith("/webinars/456");
  });
});
