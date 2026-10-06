import "server-only";
import { z } from "zod";
import type { LiveContext } from "../server";
import { checked, LiveError } from "../errors";
import type { LiveSession } from "../types";
import { canTransition } from "../schemas";
import { zoomRequest } from "../zoom.server";
export async function changeSessionStatus(
  context: LiveContext,
  session: LiveSession,
  body: unknown,
) {
  const { status } = z
    .object({ status: z.enum(["live", "ended", "cancelled"]) })
    .strict()
    .parse(body);
  if (session.status === status) return { session };
  if (!canTransition(session.status, status))
    throw new LiveError(409, "La sesión ya cambió de estado");
  if (status === "live" && session.instructor_id !== context.userId)
    throw new LiveError(
      403,
      "Solo el instructor anfitrión puede iniciar la sesión",
    );
  if (session.zoom_meeting_id && status === "cancelled")
    await zoomRequest(`/meetings/${session.zoom_meeting_id}`, "DELETE");
  if (session.zoom_meeting_id && status === "ended")
    await zoomRequest(`/meetings/${session.zoom_meeting_id}/status`, "PUT", {
      action: "end",
    });
  const updated = checked(
    await context.db
      .from("live_sessions")
      .update({ status })
      .eq("id", session.id)
      .eq("status", session.status)
      .select("*")
      .maybeSingle(),
  );
  if (!updated) throw new LiveError(409, "La sesión ya cambió de estado");
  return { session: updated };
}
