// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { updateInstructor } from "../services/instructors.service";
import { zoomRequest } from "../zoom.server";
import type { LiveContext } from "../server";

vi.mock("../zoom.server", () => ({ zoomRequest: vi.fn() }));
const upsert = vi.fn();
function context(member = true, isAdmin = true): LiveContext {
  return {
    orgId: "company",
    userId: "owner",
    isAdmin,
    db: {
      from: (table: string) => {
        if (table === "organization_instructors") return { upsert };
        const result =
          table === "users"
            ? { id: "teacher", email: "teacher@example.test" }
            : member
              ? { user_id: "teacher" }
              : null;
        const query = {
          select: () => query,
          eq: () => query,
          maybeSingle: async () => ({ data: result, error: null }),
        };
        return query;
      },
    },
  } as unknown as LiveContext;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("ZOOM_ACCOUNT_ID", "master-account");
  upsert.mockResolvedValue({ data: null, error: null });
});
afterEach(() => vi.unstubAllEnvs());
const input = {
  email: "teacher@example.test",
  zoom_user_id: "master@example.test",
};

describe("vinculación autorizada a anfitriones de la cuenta maestra", () => {
  it("permite correos distintos y guarda el ID canónico para el miembro de esta organización", async () => {
    vi.mocked(zoomRequest).mockResolvedValue({
      id: "zoom-host-id",
      email: "master@example.test",
      account_id: "master-account",
      status: "active",
    });
    await expect(updateInstructor(context(), input)).resolves.toEqual({
      success: true,
    });
    expect(upsert).toHaveBeenCalledWith({
      organization_id: "company",
      user_id: "teacher",
      zoom_user_id: "zoom-host-id",
    });
  });
  it.each([
    { id: "host", status: "active", account_id: "other-account" },
    { id: "host", status: "inactive", account_id: "master-account" },
    { id: "host", status: "active" },
    { status: "active", account_id: "master-account" },
  ])(
    "rechaza anfitriones ajenos, inactivos o incompletos: %j",
    async (user) => {
      vi.mocked(zoomRequest).mockResolvedValue(user);
      await expect(updateInstructor(context(), input)).rejects.toMatchObject({
        status: 403,
      });
      expect(upsert).not.toHaveBeenCalled();
    },
  );
  it("solo un administrador puede crear el vínculo", async () => {
    await expect(
      updateInstructor(context(true, false), input),
    ).rejects.toMatchObject({ status: 403 });
    expect(zoomRequest).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });
  it("no vincula a usuarios sin membresía activa en la organización", async () => {
    await expect(updateInstructor(context(false), input)).rejects.toMatchObject(
      { status: 404 },
    );
    expect(zoomRequest).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });
});
