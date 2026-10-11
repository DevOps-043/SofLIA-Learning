import "server-only";
import { createHash } from "node:crypto";
import type { LiveContext } from "../server";
import { checked, LiveError } from "../errors";
import { scheduleSchema } from "../schemas";
import { zoomRequest } from "../zoom.server";
import { logger } from "@/lib/utils/logger";
import { LIVE_SESSION_COLUMNS } from "../columns";
export async function scheduleSession(context: LiveContext, body: unknown) {
  if (!context.canTeach)
    throw new LiveError(403, "Necesitas el rol de instructor");
  const { request_id: requestId, ...input } = scheduleSchema.parse(body);
  const course = checked(
    await context.db
      .from("courses")
      .select("id,instructor_id")
      .eq("id", input.course_id)
      .maybeSingle(),
  );
  if (!course || course.instructor_id !== context.userId)
    throw new LiveError(403, "Solo puedes programar los cursos de tu autoría");
  const host = context.instructor?.zoom_user_id;
  if (!host)
    throw new LiveError(
      409,
      "El administrador debe vincular tu usuario de Zoom en Instructores",
    );
  const payloadHash = createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
  const reservation = await context.db.from("live_scheduling_requests").insert({
    id: requestId,
    organization_id: context.orgId,
    user_id: context.userId,
    payload_hash: payloadHash,
  });
  if (reservation.error?.code === "23505") {
    const previous = checked(
      await context.db
        .from("live_scheduling_requests")
        .select("payload_hash,state,session_id")
        .eq("id", requestId)
        .eq("organization_id", context.orgId)
        .eq("user_id", context.userId)
        .maybeSingle(),
    );
    if (!previous || previous.payload_hash !== payloadHash)
      throw new LiveError(409, "La solicitud ya existe con otros datos");
    if (previous.state === "completed" && previous.session_id)
      return {
        session: checked(
          await context.db
            .from("live_sessions")
            .select(LIVE_SESSION_COLUMNS)
            .eq("id", previous.session_id)
            .single(),
        ),
      };
    throw new LiveError(
      409,
      "La programación está pendiente o requiere revisión. No reintentes con una nueva solicitud hasta verificar Zoom.",
    );
  }
  checked(reservation);
  let meetingId: string | undefined;
  const resource = input.session_type === "webinar" ? "webinars" : "meetings";
  try {
    const meeting = await zoomRequest(
      `/users/${encodeURIComponent(host)}/${resource}`,
      "POST",
      {
        topic: input.title,
        type: input.session_type === "webinar" ? 5 : 2,
        start_time: input.starts_at,
        duration: input.duration_minutes,
        timezone: "UTC",
        settings: input.session_type === "webinar" ? { approval_type: 2 } : {
          join_before_host: false,
          waiting_room: true,
          mute_upon_entry: true,
          approval_type: 2,
        },
      },
    );
    meetingId = String(meeting.id);
    const session = checked(
      await context.db.rpc("live_finalize_session", {
        p_request: requestId,
        p_host: host,
        p_password: meeting.password || "",
        p_session: {
          ...input,
          organization_id: context.orgId,
          instructor_id: context.userId,
          ...(input.session_type === "webinar" ? { zoom_webinar_id: meetingId } : { zoom_meeting_id: meetingId }),
        },
      }),
    );
    return { session };
  } catch (error) {
    // A lost HTTP response may hide a committed transaction: reconcile before compensation.
    const saved = await context.db
      .from("live_scheduling_requests")
      .select("state,session_id")
      .eq("id", requestId)
      .maybeSingle();
    if (saved.data?.state === "completed" && saved.data.session_id)
      return {
        session: checked(
          await context.db
            .from("live_sessions")
            .select(LIVE_SESSION_COLUMNS)
            .eq("id", saved.data.session_id)
            .single(),
        ),
      };
    let state: "failed" | "uncertain" = "uncertain";
    if (meetingId && !saved.error) {
      try {
        await zoomRequest(`/${resource}/${meetingId}`, "DELETE");
        state = "failed";
      } catch {
        logger.error("Live meeting compensation requires reconciliation", {
          requestId,
        });
      }
    }
    await context.db
      .from("live_scheduling_requests")
      .update({ state })
      .eq("id", requestId)
      .eq("state", "pending");
    logger.error("Live scheduling failed", { requestId, state });
    throw error;
  }
}
