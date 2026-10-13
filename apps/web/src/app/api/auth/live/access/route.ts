import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyAuthReadRateLimit } from "@/lib/auth/auth-rate-limit";
import { readJwtBearerToken } from "@/lib/auth/bearer-token";
import { handleLive, json, liveActorContext, liveSession, LiveError } from "@/features/live/server";
import { hubSessionReferenceSchema } from "@/features/live/hub-link";
import { getHubSessionAccess } from "@/features/live/services/hub-access.service";

/** El Hub llama desde main. El bearer se valida en Auth, nunca se decodifica sin verificar. */
export async function POST(request: NextRequest) {
  return handleLive(async () => {
    const token = readJwtBearerToken(request.headers.get("authorization"));
    if (!token) throw new LiveError(401, "Inicia sesión en Soflia Hub");
    const db = createAdminClient();
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user) throw new LiveError(401, "La sesión de Soflia Hub no es válida");
    const limited = applyAuthReadRateLimit(request, data.user.id);
    if (limited) {
      const response = new NextResponse(limited.body, { status: limited.status, headers: limited.headers });
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    const input = hubSessionReferenceSchema.parse(await request.json());
    const { data: organization, error: organizationError } = await db
      .from("organizations").select("id,is_active").eq("slug", input.organization_slug).maybeSingle();
    if (organizationError) throw new LiveError(503, "No se pudo verificar la organización");
    if (!organization || !organization.is_active) throw new LiveError(403, "Organización sin acceso");
    const context = await liveActorContext(data.user.id, organization.id);
    const { session, canManage } = await liveSession(context, input.session_id);
    const response = json(await getHubSessionAccess(context, session, canManage));
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  });
}
