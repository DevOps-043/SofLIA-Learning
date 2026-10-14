import "server-only";
import { LiveError } from "./errors";
import { zoomRequest } from "./zoom.server";

/** El administrador vincula un anfitrión de la cuenta maestra, por su ID estable. */
export async function configuredZoomHost(
  userId: string,
): Promise<{ id: string; type?: unknown; feature?: unknown; email?:unknown }> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  if (!accountId)
    throw new LiveError(503, "Configura ZOOM_ACCOUNT_ID para activar Zoom");
  const user: unknown = await zoomRequest(
    `/users/${encodeURIComponent(userId)}`,
  );
  if (
    !user ||
    typeof user !== "object" ||
    !("id" in user) ||
    typeof user.id !== "string" ||
    !user.id ||
    !("status" in user) ||
    user.status !== "active" ||
    !("account_id" in user) ||
    user.account_id !== accountId
  )
    throw new LiveError(
      403,
      "El anfitrión debe estar activo y pertenecer a la cuenta Zoom maestra conectada.",
    );
  return { id: user.id,...("type" in user?{type:user.type}:{}),...("feature" in user?{feature:user.feature}:{}),...("email" in user?{email:user.email}:{}) };
}
