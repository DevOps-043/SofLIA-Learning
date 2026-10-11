// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildHubSessionLink } from "../hub-link";
import { getHubSessionAccess, isZoomAccessUrl } from "../services/hub-access.service";
import { zoomRequest } from "../zoom.server";
import type { LiveContext } from "../server";
import type { LiveSession } from "../types";

vi.mock("../zoom.server", () => ({ zoomRequest: vi.fn() }));
const id = "00000000-0000-4000-8000-000000000031";
const session = { id, instructor_id: "teacher", status: "live", zoom_meeting_id: "123", title: "Clase", starts_at: "2026-10-10T20:00:00Z" } as LiveSession;
function context(userId: string, teacher = false): LiveContext {
  return { userId, canTeach: teacher, instructor: teacher ? { zoom_user_id: "host" } : null,
    db: { from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { email: "teacher@example.test" }, error: null }) }) }) }) },
  } as unknown as LiveContext;
}
beforeEach(() => vi.resetAllMocks());
describe("Acceso de Learning a Hub", () => {
  it("el deep link lleva solo la referencia y rechaza slugs manipulados", () => {
    const url = new URL(buildHubSessionLink("acme", id));
    expect(url.protocol).toBe("soflia:");
    expect([...url.searchParams.keys()]).toEqual(["organization_slug", "session_id"]);
    expect(() => buildHubSessionLink("acme&role=host", id)).toThrow();
  });
  it.each(["https://zoom.us.evil.test/j/123", "http://zoom.us/j/123", "https://user@zoom.us/j/123", "javascript:alert(1)", "https://zoom.us:8443/j/123"])("rechaza destino %s", (url) => expect(isZoomAccessUrl(url)).toBe(false));
  it("un administrador que supervisa recibe acceso de participante", async () => {
    vi.mocked(zoomRequest).mockResolvedValue({ join_url: "https://zoom.us/j/123", start_url: "https://zoom.us/s/123?zak=host-only", host_id: "host" });
    const result = await getHubSessionAccess(context("admin"), session, true);
    expect(result.role).toBe("participant");
    expect(result.join_url).toBe("https://zoom.us/j/123");
  });
  it("solo el instructor vinculado recibe el inicio efímero del anfitrión", async () => {
    vi.mocked(zoomRequest).mockResolvedValueOnce({ host_id: "host", start_url: "https://zoom.us/s/123?zak=host-only" })
      .mockResolvedValueOnce({ email: "teacher@example.test", status: "active" });
    expect((await getHubSessionAccess(context("teacher", true), session, true)).role).toBe("host");
  });
  it("rechaza un anfitrión Zoom que pertenece a otra persona", async () => {
    vi.mocked(zoomRequest).mockResolvedValueOnce({ host_id: "other", start_url: "https://zoom.us/s/123" })
      .mockResolvedValueOnce({ email: "other@example.test", status: "active" });
    await expect(getHubSessionAccess(context("teacher", true), session, true)).rejects.toMatchObject({ status: 403 });
  });
  it("al retirar la capacidad docente ya no entrega acceso de host", async () => {
    vi.mocked(zoomRequest).mockResolvedValue({ join_url: "https://zoom.us/j/123" });
    expect((await getHubSessionAccess(context("teacher"), session, true)).role).toBe("participant");
  });
  it.each(["ended", "cancelled"])("no consulta Zoom para una sesión %s", async (status) => {
    await expect(getHubSessionAccess(context("student"), { ...session, status } as LiveSession, false)).rejects.toMatchObject({ status: 409 });
    expect(zoomRequest).not.toHaveBeenCalled();
  });
  it("resuelve webinars con su recurso propio", async () => {
    vi.mocked(zoomRequest).mockResolvedValue({ join_url: "https://zoom.us/w/456" });
    await getHubSessionAccess(context("student"), { ...session, session_type: "webinar", zoom_webinar_id: "456" }, false);
    expect(zoomRequest).toHaveBeenCalledWith("/webinars/456");
  });
});
