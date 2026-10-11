// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ user: vi.fn(), admin: vi.fn() }));
vi.mock("@/features/auth/services/session.service", () => ({ SessionService: { getCurrentUser: mocks.user } }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.admin }));
import { GET } from "../route";
import { liveContext, liveActorContext } from "@/features/live/server";

const tables: Record<string, Record<string, unknown>[]> = {};
function database() {
  return {
    from: vi.fn((table: string) => {
      const filters = new Map<string, unknown>();
      const query = {
        select: vi.fn(() => query),
        eq: vi.fn((key: string, value: unknown) => { filters.set(key, value); return query; }),
        maybeSingle: vi.fn(async () => ({
          data: tables[table]?.find((row) => [...filters].every(([key, value]) => row[key] === value)) || null,
          error: null,
        })),
      };
      return query;
    }),
  };
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({ id: "teacher", platform_role: "Instructor" });
  tables.organizations = [{ id: "org", slug: "demo", is_active: true }];
  tables.users = [{ id: "teacher", is_banned: false }];
  tables.organization_users = [{ organization_id: "org", user_id: "teacher", role: "member", status: "active" }];
  tables.organization_instructors = [{ organization_id: "org", user_id: "teacher", zoom_user_id: "host" }];
  mocks.admin.mockReturnValue(database());
});
afterEach(() => vi.unstubAllEnvs());
const request = () => new NextRequest("https://learning.test/api/demo/live/capabilities?user_id=other");
const context = () => ({ params: Promise.resolve({ orgSlug: "demo" }) });

describe("Permisos para navegar al panel de instructor", () => {
  it("reconoce al docente de la organización aunque su rol global sea Instructor", async () => {
    const response = await GET(request(), context());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ canTeach: true });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("conserva el acceso operativo del docente sin activación opcional", async () => {
    expect(await liveContext("demo")).toMatchObject({ userId: "teacher", orgId: "org", canTeach: true });
  });
  it("permite navegación administrativa al miembro admin sin convertirlo en docente", async () => {
    tables.organization_instructors = [];
    tables.organization_users[0].role = "admin";
    expect(await (await GET(request(), context())).json()).toEqual({ canTeach: true });
  });
  it("no confunde al alumno con un docente de otra organización ni acepta el usuario del query", async () => {
    tables.organization_instructors = [
      { organization_id: "foreign", user_id: "teacher" },
      { organization_id: "org", user_id: "other" },
    ];
    expect(await (await GET(request(), context())).json()).toEqual({ canTeach: false });
  });
  it.each(["membresía suspendida", "organización inactiva", "cuenta bloqueada"])("rechaza %s", async (reason) => {
    if (reason === "membresía suspendida") tables.organization_users[0].status = "suspended";
    if (reason === "organización inactiva") tables.organizations[0].is_active = false;
    if (reason === "cuenta bloqueada") tables.users[0].is_banned = true;
    expect((await GET(request(), context())).status).toBe(403);
  });
  it("rechaza sesión ausente antes de leer permisos", async () => {
    mocks.user.mockResolvedValue(null);
    expect((await GET(request(), context())).status).toBe(401);
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it.each([undefined, "false"])("mantiene el acceso web y Hub aunque la antigua variable sea %s", async (value) => {
    vi.stubEnv("NEXT_PUBLIC_LIVE_LEARNING_ENABLED", value);
    expect(await liveContext("demo")).toMatchObject({ canTeach: true, orgId: "org" });
    expect(await liveActorContext("teacher", "org")).toMatchObject({ canTeach: true, orgId: "org" });
  });
  it("mantiene el control de membresía en el acceso Hub", async () => {
    tables.organization_users[0].status = "suspended";
    await expect(liveActorContext("teacher", "org")).rejects.toMatchObject({ status: 403 });
  });
});
