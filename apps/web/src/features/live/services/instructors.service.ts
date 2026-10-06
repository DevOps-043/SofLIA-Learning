import "server-only";
import { z } from "zod";
import type { LiveContext } from "../server";
import { checked, LiveError } from "../errors";
const instructorSchema = z
  .object({
    email: z.string().email(),
    zoom_user_id: z.string().trim().min(1).max(200),
    revoke: z.boolean().default(false),
  })
  .strict();
export async function updateInstructor(context: LiveContext, body: unknown) {
  if (!context.isAdmin)
    throw new LiveError(
      403,
      "Solo administradores y propietarios pueden asignar instructores",
    );
  const input = instructorSchema.parse(body);
  const user = checked(
    await context.db
      .from("users")
      .select("id")
      .eq("email", input.email)
      .maybeSingle(),
  );
  const member =
    user &&
    checked(
      await context.db
        .from("organization_users")
        .select("user_id")
        .eq("organization_id", context.orgId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle(),
    );
  if (!member)
    throw new LiveError(
      404,
      "El usuario debe ser miembro activo de esta organización",
    );
  if (input.revoke)
    checked(
      await context.db
        .from("organization_instructors")
        .delete()
        .eq("organization_id", context.orgId)
        .eq("user_id", member.user_id),
    );
  else
    checked(
      await context.db
        .from("organization_instructors")
        .upsert({
          organization_id: context.orgId,
          user_id: member.user_id,
          zoom_user_id: input.zoom_user_id,
        }),
    );
  return { success: true };
}
