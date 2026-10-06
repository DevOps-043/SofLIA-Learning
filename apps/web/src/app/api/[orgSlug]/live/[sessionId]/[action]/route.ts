import { NextRequest } from "next/server";
import {
  handleLive,
  json,
  liveContext,
  liveSession,
  LiveError,
} from "@/features/live/server";
import {
  dispatchLiveAction,
  liveActionSchema,
} from "@/features/live/services/actions.service";
import { checkDistributedRateLimit } from "@/core/lib/rate-limit";
type Context = {
  params: Promise<{ orgSlug: string; sessionId: string; action: string }>;
};
export async function POST(request: NextRequest, { params }: Context) {
  return handleLive(async () => {
    const { orgSlug, sessionId, action: rawAction } = await params;
    const action = liveActionSchema.parse(rawAction);
    const context = await liveContext(orgSlug);
    const { session, canManage } = await liveSession(
      context,
      sessionId,
      ["activities", "upload", "transcript"].includes(action),
    );
    if (
      !["download", "soflia"].includes(action) &&
      ["ended", "cancelled"].includes(session.status)
    )
      throw new LiveError(409, "La sesión está cerrada");
    const ai = ["soflia", "messages"].includes(action);
    const limit = await checkDistributedRateLimit(
      request,
      { maxRequests: ai ? 30 : 120, windowMs: 60000 },
      ai ? "ai-chat" : "upload",
    );
    if (!limit.success && limit.response) return limit.response;
    const body =
      action === "upload" ? await request.formData() : await request.json();
    return json(
      await dispatchLiveAction({ context, session, canManage, action, body }),
    );
  });
}
