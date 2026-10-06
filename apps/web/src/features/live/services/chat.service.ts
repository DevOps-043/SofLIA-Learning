import "server-only";
import type { LiveContext } from "../server";
import { checked, requiredData, LiveError } from "../errors";
import type { LiveSession } from "../types";
import { z } from "zod";
import { askLiveSoflia } from "../soflia.server";
export async function sendChat(
  ctx: LiveContext,
  session: LiveSession,
  canManage: boolean,
  body: unknown,
  action: string,
) {
  const sessionId = session.id;
  const input = z
    .object({
      content: z.string().trim().min(1).max(2000),
      private: z.boolean().default(true),
    })
    .parse(body);
  if (action === "messages") {
    if (session.status !== "live")
      throw new LiveError(409, "El chat abre cuando comienza la sesión");
    const user = requiredData(
      await ctx.db
        .from("users")
        .select("display_name,first_name")
        .eq("id", ctx.userId)
        .single(),
    );
    const message = checked(
      await ctx.db
        .from("live_messages")
        .insert({
          session_id: sessionId,
          user_id: ctx.userId,
          author_name: user.display_name || user.first_name || "Participante",
          content: input.content,
        })
        .select("*")
        .single(),
    );
    // Chat is durable even if the AI provider is unavailable.
    let aiError: string | undefined;
    if (/@soflia\b/i.test(input.content)) {
      try {
        await askLiveSoflia(ctx, session, input.content, false);
      } catch {
        aiError =
          "Tu mensaje se publicó, pero Soflia no pudo responder. Inténtalo más tarde.";
      }
    }
    return { message, aiError };
  }
  // Public answers can only be triggered by a persisted public message.
  if (!input.private)
    throw new LiveError(400, "Menciona @Soflia en el chat público");
  return { answer: await askLiveSoflia(ctx, session, input.content, true) };
}
