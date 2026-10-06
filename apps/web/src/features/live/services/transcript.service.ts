import "server-only";
import type { LiveContext } from "../server";
import { checked, LiveError } from "../errors";
import type { LiveSession } from "../types";
import { z } from "zod";
export async function saveTranscript(
  ctx: LiveContext,
  session: LiveSession,
  canManage: boolean,
  body: unknown,
) {
  const sessionId = session.id;
  if (
    !canManage ||
    ctx.userId !== session.instructor_id ||
    session.status !== "live"
  )
    throw new LiveError(
      403,
      "Solo el anfitrión activo puede enviar transcripciones",
    );
  const input = z
    .object({
      source_id: z.string().min(1).max(200),
      speaker: z.string().max(200),
      content: z.string().trim().min(1).max(8000),
      spoken_at: z.string().datetime(),
    })
    .parse(body);
  if (Math.abs(Date.now() - Date.parse(input.spoken_at)) > 120000)
    throw new LiveError(400, "Segmento de transcripción fuera de tiempo");
  checked(
    await ctx.db
      .from("live_transcripts")
      .upsert(
        { ...input, session_id: sessionId },
        { onConflict: "session_id,source_id" },
      ),
  );
  return { success: true };
}
