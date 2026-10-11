import { z } from "zod";

export const hubSessionReferenceSchema = z.object({
  organization_slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  session_id: z.string().uuid(),
}).strict();

/** El enlace solo identifica la sesión. Hub vuelve a autenticar y autorizar. */
export function buildHubSessionLink(orgSlug: string, sessionId: string): string {
  const reference = hubSessionReferenceSchema.parse({
    organization_slug: orgSlug,
    session_id: sessionId,
  });
  const url = new URL("soflia://learning-session");
  url.searchParams.set("organization_slug", reference.organization_slug);
  url.searchParams.set("session_id", reference.session_id);
  return url.toString();
}
