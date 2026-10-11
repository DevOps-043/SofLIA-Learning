import { NextRequest } from "next/server";
import {
  handleLive,
  json,
  liveContext,
  liveSession,
} from "@/features/live/server";
import { buildHubSessionLink } from "@/features/live/hub-link";
import { changeSessionStatus } from "@/features/live/services/lifecycle.service";
type Context = { params: Promise<{ orgSlug: string; sessionId: string }> };
export async function GET(_request: NextRequest, { params }: Context) {
  return handleLive(async () => {
    const { orgSlug, sessionId } = await params;
    const context = await liveContext(orgSlug);
    const { session, canManage } = await liveSession(context, sessionId);
    return json({ session, canManage, hub_url: buildHubSessionLink(orgSlug, session.id) });
  });
}
export async function PATCH(request: NextRequest, { params }: Context) {
  return handleLive(async () => {
    const { orgSlug, sessionId } = await params;
    const context = await liveContext(orgSlug);
    const { session } = await liveSession(context, sessionId, true);
    return json(
      await changeSessionStatus(context, session, await request.json()),
    );
  });
}
