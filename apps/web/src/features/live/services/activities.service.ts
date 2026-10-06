import "server-only";
import type { LiveContext } from "../server";
import { checked, LiveError } from "../errors";
import type { LiveSession } from "../types";
import { activitySchema } from "../schemas";
export async function publishActivity(
  context: LiveContext,
  session: LiveSession,
  canManage: boolean,
  body: unknown,
) {
  if (!canManage)
    throw new LiveError(403, "Solo el instructor puede publicar actividades");
  const { correct_option, ...activity } = activitySchema.parse(body);
  return {
    activity: checked(
      await context.db.rpc("live_publish_activity", {
        p_session: session.id,
        p_activity: activity,
        p_correct: correct_option ?? null,
      }),
    ),
  };
}
