import "server-only";
import type { LiveContext } from "../server";
import { requiredData, LiveError } from "../errors";
import type { LiveSession } from "../types";
import { meetingSignature, zoomRequest } from "../zoom.server";
export async function joinSession(
  ctx: LiveContext,
  session: LiveSession,
  canManage: boolean,
) {
  const sessionId = session.id;
  const host = canManage && session.instructor_id === ctx.userId;
  if (!host && session.status !== "live")
    throw new LiveError(409, "Espera a que el instructor inicie la sesión");
  if (!session.zoom_meeting_id)
    throw new LiveError(409, "La sesión no tiene reunión de Zoom");
  const secret = requiredData(
    await ctx.db
      .from("live_zoom_credentials")
      .select("*")
      .eq("session_id", sessionId)
      .single(),
  );
  const user = requiredData(
    await ctx.db
      .from("users")
      .select("display_name,first_name")
      .eq("id", ctx.userId)
      .single(),
  );
  const signature = meetingSignature(session.zoom_meeting_id, host ? 1 : 0);
  const zak = host
    ? (
        await zoomRequest(
          `/users/${encodeURIComponent(secret.host_id)}/token?type=zak`,
        )
      ).token
    : undefined;
  return {
    signature,
    meetingNumber: session.zoom_meeting_id,
    password: secret.password,
    userName: user.display_name || user.first_name || "Participante",
    ...(zak ? { zak } : {}),
  };
}
