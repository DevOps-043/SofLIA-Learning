import "server-only";
import type { LiveContext } from "../server";
import { checked, requiredData, LiveError } from "../errors";
import type { LiveSession } from "../types";
import { z } from "zod";
export async function respondOrDownload(
  ctx: LiveContext,
  session: LiveSession,
  canManage: boolean,
  body: unknown,
  action: string,
) {
  const sessionId = session.id;
  const input = z
    .object({
      activity_id: z.string().uuid(),
      answer: z.number().int().min(0).max(5).optional(),
    })
    .parse(body);
  const activity = checked(
    await ctx.db
      .from("live_activities")
      .select("*")
      .eq("id", input.activity_id)
      .eq("session_id", sessionId)
      .maybeSingle(),
  );
  if (!activity) throw new LiveError(404, "Actividad no encontrada");
  if (action === "download") {
    if (!activity.file_path) throw new LiveError(404, "Archivo no encontrado");
    return checked(
      await ctx.db.storage
        .from("live-materials")
        .createSignedUrl(activity.file_path, 60, { download: true }),
    );
  }
  if (session.status !== "live")
    throw new LiveError(409, "La actividad está cerrada");
  let isCorrect: boolean | null = null;
  if (activity.kind === "quiz") {
    if (input.answer === undefined || input.answer >= activity.options.length)
      throw new LiveError(400, "Selecciona una respuesta válida");
    const key = requiredData(
      await ctx.db
        .from("live_quiz_keys")
        .select("correct_option")
        .eq("activity_id", activity.id)
        .single(),
    );
    isCorrect = key.correct_option === input.answer;
  }
  const saved = await ctx.db.from("live_activity_responses").insert({
    activity_id: activity.id,
    user_id: ctx.userId,
    answer: input.answer ?? null,
    is_correct: isCorrect,
  });
  if (saved.error?.code === "23505")
    throw new LiveError(409, "Ya enviaste tu respuesta");
  checked(saved);
  return { is_correct: isCorrect };
}
