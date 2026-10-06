import "server-only";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireBusinessUser } from "@/lib/auth/requireBusiness";
import type { LiveDatabase } from "./database.types";
import { LiveError, checked } from "./errors";
import { logger } from "@/lib/utils/logger";
import { incrementCounter } from "@/lib/observability/metrics";
import { z } from "zod";
import { LIVE_LEARNING_ENABLED } from "./config";
export { LiveError, checked, requiredData } from "./errors";

export async function liveContext(orgSlug: string) {
  if (!LIVE_LEARNING_ENABLED)
    throw new LiveError(503, "In Live no está habilitado todavía");
  const auth = await requireBusinessUser({ organizationSlug: orgSlug });
  if (auth instanceof NextResponse)
    throw new LiveError(auth.status, "No tienes acceso a esta organización");
  if (!auth.organizationId) throw new LiveError(403, "Organización requerida");
  const db = createAdminClient() as unknown as SupabaseClient<LiveDatabase>;
  const account = checked(
    await db
      .from("users")
      .select("is_banned")
      .eq("id", auth.userId)
      .maybeSingle(),
  );
  if (!account || account.is_banned)
    throw new LiveError(403, "Cuenta sin acceso a In Live");
  const member = checked(
    await db
      .from("organization_users")
      .select("role")
      .eq("organization_id", auth.organizationId)
      .eq("user_id", auth.userId)
      .eq("status", "active")
      .maybeSingle(),
  );
  if (!member) throw new LiveError(403, "Se requiere membresía activa");
  const instructor = checked(
    await db
      .from("organization_instructors")
      .select("*")
      .eq("organization_id", auth.organizationId)
      .eq("user_id", auth.userId)
      .maybeSingle(),
  );
  const isAdmin = ["owner", "admin"].includes(member.role || "");
  return {
    db,
    userId: auth.userId,
    orgId: auth.organizationId,
    isAdmin,
    canTeach: isAdmin || !!instructor,
    instructor,
  };
}
export type LiveContext = Awaited<ReturnType<typeof liveContext>>;
export async function liveSession(
  ctx: LiveContext,
  id: string,
  manage = false,
) {
  z.string().uuid().parse(id);
  const session = checked(
    await ctx.db
      .from("live_sessions")
      .select("*")
      .eq("id", id)
      .eq("organization_id", ctx.orgId)
      .maybeSingle(),
  );
  if (!session) throw new LiveError(404, "Sesión no encontrada");
  const canManage =
    ctx.isAdmin || (ctx.canTeach && session.instructor_id === ctx.userId);
  if (manage && !canManage)
    throw new LiveError(403, "Esta sesión pertenece a otro instructor");
  if (!canManage) {
    const assigned = checked(
      await ctx.db
        .from("organization_course_assignments")
        .select("id")
        .eq("organization_id", ctx.orgId)
        .eq("course_id", session.course_id)
        .eq("user_id", ctx.userId)
        .limit(1),
    );
    if (!assigned?.length)
      throw new LiveError(403, "No tienes asignado este curso");
  }
  return { session, canManage };
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export async function handleLive(work: () => Promise<NextResponse>) {
  try {
    return await work();
  } catch (error) {
    if (error instanceof LiveError) {
      if (error.status >= 500) {
        incrementCounter("live_request_errors_total", { status: error.status });
        logger.error("Live dependency failure", { status: error.status });
      }
      return json({ error: error.message }, error.status);
    }
    if (
      error instanceof Error &&
      (error.name === "ZodError" || error.name === "SyntaxError")
    )
      return json({ error: "Revisa los datos enviados" }, 400);
    incrementCounter("live_request_errors_total");
    logger.error("Live request failed", {
      errorType: error instanceof Error ? error.name : "unknown",
    });
    return json({ error: "No se pudo completar la operación In Live" }, 500);
  }
}
