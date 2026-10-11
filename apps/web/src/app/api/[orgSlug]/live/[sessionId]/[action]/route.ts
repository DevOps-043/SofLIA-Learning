import { handleLive, json, liveContext, liveSession } from "@/features/live/server";
type Context = {
  params: Promise<{ orgSlug: string; sessionId: string; action: string }>;
};
/** Retirada explícita de los contratos del aula anterior. */
export async function POST(_request: Request, { params }: Context) {
  return handleLive(async () => {
    const { orgSlug, sessionId } = await params;
    await liveSession(await liveContext(orgSlug), sessionId);
    return json({ error: "La interacción en vivo se realiza en Soflia Hub. Abre la sesión desde tu agenda." }, 410);
  });
}
