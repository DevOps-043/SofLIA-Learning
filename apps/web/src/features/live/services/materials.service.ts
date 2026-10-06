import "server-only";
import type { LiveContext } from "../server";
import { checked, LiveError } from "../errors";
import type { LiveSession } from "../types";
import { randomUUID } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
export async function uploadMaterial(
  ctx: LiveContext,
  session: LiveSession,
  canManage: boolean,
  form: FormData,
) {
  if (!canManage)
    throw new LiveError(403, "Solo el instructor puede publicar materiales");
  const sessionId = session.id;
  const file = form.get("file");
  if (!(file instanceof File) || !file.size || file.size > 10 * 1024 * 1024)
    throw new LiveError(400, "Adjunta un archivo de hasta 10 MB");
  const bytes = Buffer.from(await file.arrayBuffer()),
    type = await fileTypeFromBuffer(bytes);
  if (
    !type ||
    !["application/pdf", "image/png", "image/jpeg"].includes(type.mime)
  )
    throw new LiveError(400, "Solo se permiten archivos PDF, PNG y JPEG");
  const path = `${ctx.orgId}/${sessionId}/${randomUUID()}.${type.ext}`;
  checked(
    await ctx.db.storage
      .from("live-materials")
      .upload(path, bytes, { contentType: type.mime, upsert: false }),
  );
  const result = await ctx.db
    .from("live_activities")
    .insert({
      session_id: sessionId,
      kind: "file",
      title: file.name.slice(0, 180),
      file_path: path,
    })
    .select("*")
    .single();
  if (result.error) {
    await ctx.db.storage.from("live-materials").remove([path]);
    throw new LiveError(503, "No se pudo publicar el archivo");
  }
  return { activity: result.data };
}
