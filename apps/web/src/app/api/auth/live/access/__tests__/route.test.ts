// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { LiveError } from "@/features/live/errors";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), org: vi.fn(), actor: vi.fn(), session: vi.fn(), access: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ auth: { getUser: mocks.getUser }, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.org }) }) }) }) }));
vi.mock("@/lib/auth/auth-rate-limit", () => ({ applyAuthReadRateLimit: () => null }));
vi.mock("@/features/live/server", async () => {
  const original = await vi.importActual<typeof import("@/features/live/server")>("@/features/live/server");
  return { ...original, liveActorContext: mocks.actor, liveSession: mocks.session };
});
vi.mock("@/features/live/services/hub-access.service", () => ({ getHubSessionAccess: mocks.access }));
import { POST } from "../route";
const reference = { organization_slug: "acme", session_id: "00000000-0000-4000-8000-000000000031" };
function request(token = "verified-token", body: unknown = reference) {
  return new NextRequest("https://learning.test/api/auth/live/access", { method: "POST", headers: token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {}, body: JSON.stringify(body) });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "student" } }, error: null });
  mocks.org.mockResolvedValue({ data: { id: "org", is_active: true }, error: null });
  mocks.actor.mockResolvedValue({ userId: "student", orgId: "org" });
  mocks.session.mockResolvedValue({ session: { id: reference.session_id }, canManage: false });
  mocks.access.mockResolvedValue({ join_url: "https://zoom.us/j/123" });
});
describe("Acceso autenticado del escritorio", () => {
  it("rechaza peticiones sin bearer antes de consultar usuario o reunión", async () => {
    expect((await POST(request(""))).status).toBe(401);
    expect(mocks.getUser).not.toHaveBeenCalled(); expect(mocks.access).not.toHaveBeenCalled();
  });
  it("verifica el token en Auth y nunca usa un usuario enviado por el cliente", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: "invalid" } });
    expect((await POST(request())).status).toBe(401);
    expect(mocks.actor).not.toHaveBeenCalled();
  });
  it("no acepta user_id, rol ni URL del cliente", async () => {
    expect((await POST(request("verified-token", { ...reference, user_id: "teacher", role: "host" }))).status).toBe(400);
    expect(mocks.access).not.toHaveBeenCalled();
  });
  it("revalida membresía y alcance antes de obtener acceso", async () => {
    mocks.session.mockRejectedValue(new LiveError(403, "Curso no asignado"));
    expect((await POST(request())).status).toBe(403); expect(mocks.access).not.toHaveBeenCalled();
  });
  it("rechaza organizaciones desactivadas", async () => {
    mocks.org.mockResolvedValue({ data: { id: "org", is_active: false }, error: null });
    expect((await POST(request())).status).toBe(403); expect(mocks.actor).not.toHaveBeenCalled();
  });
  it("el acceso privado no se cachea ni se filtra como referrer", async () => {
    const result = await POST(request());
    expect(result.status).toBe(200); expect(mocks.getUser).toHaveBeenCalledWith("verified-token");
    expect(mocks.actor).toHaveBeenCalledWith("student", "org");
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(result.headers.get("referrer-policy")).toBe("no-referrer");
  });
});
