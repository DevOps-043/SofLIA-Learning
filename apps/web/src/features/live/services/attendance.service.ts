import "server-only";
import type { LiveContext } from "../server";
import { checked, LiveError } from "../errors";
import type { LiveSession } from "../types";

export async function recordAttendance(
  ctx: LiveContext,
  session: LiveSession,
  _canManage: boolean,
) {
  const sessionId = session.id;
  if (session.status !== "live")
    throw new LiveError(409, "La sesión no está en vivo");
  checked(
    await ctx.db.from("live_attendance").upsert(
      {
        session_id: sessionId,
        user_id: ctx.userId,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "session_id,user_id", ignoreDuplicates: true },
    ),
  );
  checked(
    await ctx.db
      .from("live_attendance")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("session_id", sessionId)
      .eq("user_id", ctx.userId),
  );
  return { success: true };
}
