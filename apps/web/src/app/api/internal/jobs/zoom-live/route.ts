import { NextRequest } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LiveDatabase } from "@/features/live/database.types";
import { verifyZoomWebhook, zoomChallenge } from "@/features/live/zoom-webhook";
import { handleLive, json, checked, LiveError } from "@/features/live/server";

const webhookSchema = z.object({
  event: z.string(),
  payload: z.object({
    plainToken: z.string().max(500).optional(),
    account_id: z.string().optional(),
    object: z.object({ id: z.union([z.string(), z.number()]) }).optional(),
  }),
});
export async function POST(request: NextRequest) {
  return handleLive(async () => {
    const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
    if (!secret) throw new LiveError(503, "Webhook de Zoom no configurado");
    const rawBody = await request.text();
    if (
      !verifyZoomWebhook(
        rawBody,
        request.headers.get("x-zm-request-timestamp"),
        request.headers.get("x-zm-signature"),
        secret,
      )
    )
      throw new LiveError(401, "Firma inválida");
    const event = webhookSchema.parse(JSON.parse(rawBody));
    if (event.event === "endpoint.url_validation" && event.payload.plainToken)
      return json(zoomChallenge(event.payload.plainToken, secret));
    if (event.payload.account_id !== process.env.ZOOM_ACCOUNT_ID)
      throw new LiveError(403, "Cuenta no autorizada");
    if (
      !event.payload.object ||
      !["meeting.started", "meeting.ended", "meeting.deleted"].includes(
        event.event,
      )
    )
      return json({ received: true });
    // Conditional transitions make retries harmless and prevent late starts reopening ended sessions.
    const status =
      event.event === "meeting.started"
        ? "live"
        : event.event === "meeting.ended"
          ? "ended"
          : "cancelled";
    const database =
      createAdminClient() as unknown as SupabaseClient<LiveDatabase>;
    checked(
      await database
        .from("live_sessions")
        .update({ status })
        .eq("zoom_meeting_id", String(event.payload.object.id))
        .in(
          "status",
          status === "live" ? ["scheduled"] : ["scheduled", "live"],
        ),
    );
    return json({ received: true });
  });
}
