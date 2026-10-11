// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { scheduleSchema } from "../schemas";
import { liveValidationMessage } from "../validation-message";
import { handleLive } from "../server";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/utils/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/lib/observability/metrics", () => ({ incrementCounter: vi.fn() }));

describe("validación de la programación", () => {
  it("devuelve el campo que falló en vez de ocultarlo detrás del error genérico", async () => {
    const response = await handleLive(async () => {
      scheduleSchema.parse({
        request_id: "00000000-0000-4000-8000-000000000001",
        course_id: "00000000-0000-4000-8000-000000000002",
        title: "Clase",
        starts_at: "2020-01-01T00:00:00Z",
        duration_minutes: 60,
      });
      throw new Error("No debe aceptar una fecha pasada");
    });
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: "Elige una fecha y hora futura para la sesión.",
    });
  });

  it("no publica valores, rutas desconocidas ni mensajes arbitrarios del validador", () => {
    const error = new z.ZodError([
      { code: "custom", path: ["title"], message: "private-title" },
      { code: "custom", path: ["private-key"], message: "private-value" },
      { code: "custom", path: ["title"], message: "private-title" },
      { code: "custom", path: ["__proto__"], message: "private-value" },
    ]);
    expect(liveValidationMessage(error)).toBe(
      "Escribe un título de entre 1 y 160 caracteres. Revisa los datos enviados.",
    );
  });
});
