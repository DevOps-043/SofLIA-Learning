// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
const call = vi.hoisted(() => vi.fn());
vi.mock("@/lib/resilience/circuit-breaker", () => ({
  fetchWithCircuitBreaker: call,
}));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  call.mockReset();
});
describe("token administrativo compartido para una clase", () => {
  it("une las solicitudes OAuth concurrentes sin repetir operaciones REST", async () => {
    vi.stubEnv("ZOOM_ACCOUNT_ID", "account");
    vi.stubEnv("ZOOM_CLIENT_ID", "client");
    vi.stubEnv("ZOOM_CLIENT_SECRET", "test-only");
    call.mockImplementation(async (name: string) =>
      name === "zoom-oauth"
        ? new Response(
            JSON.stringify({ access_token: "test-token", expires_in: 3600 }),
          )
        : new Response(JSON.stringify({ join_url: "https://zoom.us/j/123" })),
    );
    const { zoomRequest } = await import("../zoom.server");
    await Promise.all(
      Array.from({ length: 20 }, () => zoomRequest("/meetings/123")),
    );
    expect(
      call.mock.calls.filter((args) => args[0] === "zoom-oauth"),
    ).toHaveLength(1);
    expect(
      call.mock.calls.filter((args) => args[0] === "zoom-api"),
    ).toHaveLength(20);
  });
});

describe("diagnóstico seguro de errores de Zoom", () => {
  it.each([
    [
      404,
      1001,
      "/users/host@example.test",
      /no existe en la cuenta de Zoom conectada/,
    ],
    [400, 200, "/users/host/webinars", /licencia de Zoom Webinars/],
    [401, 4711, "/users/host/webinars", /permisos de webinars/],
    [403, undefined, "/users/host/meetings", /permisos de la aplicación/],
    [401, 124, "/users/host", /token de acceso/],
    [429, undefined, "/users/host", /límite de solicitudes/],
  ] as const)(
    "clasifica HTTP %s y código %s sin exponer la respuesta remota",
    async (status, code, path, message) => {
      vi.stubEnv("ZOOM_ACCOUNT_ID", "account");
      vi.stubEnv("ZOOM_CLIENT_ID", "client");
      vi.stubEnv("ZOOM_CLIENT_SECRET", "test-only");
      call.mockImplementation(async (name: string) =>
        name === "zoom-oauth"
          ? new Response(
              JSON.stringify({ access_token: "test-token", expires_in: 3600 }),
            )
          : new Response(
              JSON.stringify({ code, message: "private-upstream-value" }),
              { status },
            ),
      );
      const { zoomRequest } = await import("../zoom.server");
      await expect(zoomRequest(path)).rejects.toThrow(message);
      expect(
        call.mock.calls.filter((args) => args[0] === "zoom-api"),
      ).toHaveLength(1);
      await expect(zoomRequest(path)).rejects.not.toThrow(
        "private-upstream-value",
      );
    },
  );

  it("mantiene un diagnóstico seguro si Zoom devuelve HTML en lugar de JSON", async () => {
    vi.stubEnv("ZOOM_ACCOUNT_ID", "account");
    vi.stubEnv("ZOOM_CLIENT_ID", "client");
    vi.stubEnv("ZOOM_CLIENT_SECRET", "test-only");
    call.mockImplementation(async (name: string) =>
      name === "zoom-oauth"
        ? new Response(
            JSON.stringify({ access_token: "test-token", expires_in: 3600 }),
          )
        : new Response("<html>private-upstream-value</html>", { status: 502 }),
    );
    const { zoomRequest } = await import("../zoom.server");
    await expect(zoomRequest("/meetings/123")).rejects.toThrow(
      "Zoom no pudo completar la operación",
    );
  });
});
