import "server-only";
import {
  checked,
  LiveError,
  liveActorContext,
  liveSession,
  type LiveContext,
} from "../server";
import { recordingDb, RECORDING_RUN_COLUMNS } from "./database";
import { recordingResponseSchema, type RecordingOperation } from "./contract";
import { RECORDING_BUCKET } from "./config";
async function recordingAccess(ctx: LiveContext, sessionId: string) {
  const active = checked(
    await ctx.db
      .from("organizations")
      .select("is_active")
      .eq("id", ctx.orgId)
      .maybeSingle(),
  );
  if (!active?.is_active) throw new LiveError(403, "Organización sin acceso.");
  const result = await liveSession(ctx, sessionId);
  const moderation = checked(
    await ctx.db
      .from("live_studio_state")
      .select("state")
      .eq("session_id", sessionId)
      .maybeSingle(),
  );
  const state = moderation?.state as
    | { moderation?: { restrictions?: Record<string, string> } }
    | undefined;
  if (state?.moderation?.restrictions?.[ctx.userId] === "blocked")
    throw new LiveError(403, "El acceso a esta sesión fue retirado.");
  return result;
}
export async function recordingOperation(
  ctx: LiveContext,
  sessionId: string,
  operation: RecordingOperation,
) {
  const { canManage, session } = await recordingAccess(ctx, sessionId);
  const db = recordingDb(ctx.db);
  const policy = checked(
    await db
      .from("live_recording_policies")
      .select("replay_enabled")
      .eq("organization_id", ctx.orgId)
      .maybeSingle(),
  );
  if (operation.type === "retry") {
    if (!canManage)
      throw new LiveError(403, "No puedes reintentar esta grabación.");
    const run = checked(
      await db
        .from("live_recording_runs")
        .select("session_id,status")
        .eq("id", operation.run_id)
        .maybeSingle(),
    );
    if (
      run?.session_id !== sessionId ||
      !["failed", "missing", "processing"].includes(run.status)
    )
      throw new LiveError(409, "La grabación no requiere reintento.");
    checked(
      await db
        .from("live_recording_jobs")
        .upsert(
          { run_id: operation.run_id },
          { onConflict: "run_id", ignoreDuplicates: true },
        ),
    );
    checked(
      await db
        .from("live_recording_jobs")
        .update({
          status: "queued",
          attempts: 0,
          available_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("run_id", operation.run_id)
        .neq("status", "running"),
    );
  }
  if (operation.type === "intent") {
    const result = await db.rpc("live_recording_intent", {
      p_org: ctx.orgId,
      p_user: ctx.userId,
      p_session: sessionId,
      p_revision: operation.revision,
      p_requested: operation.requested,
    });
    if (result.error)
      throw new LiveError(
        result.error.message.includes("CONFLICT") ? 409 : 403,
        "La preferencia cambió o no tienes permiso para publicarla. Actualiza el panel.",
      );
  }
  if (operation.type === "publish") {
    if (!canManage)
      throw new LiveError(403, "No puedes publicar esta grabación.");
    const run = checked(
      await db
        .from("live_recording_runs")
        .select("session_id")
        .eq("id", operation.run_id)
        .maybeSingle(),
    );
    if (run?.session_id !== sessionId)
      throw new LiveError(403, "Grabación sin acceso.");
    const result = await db.rpc("live_recording_publish", {
      p_org: ctx.orgId,
      p_user: ctx.userId,
      p_run: operation.run_id,
      p_revision: operation.revision,
      p_publish: operation.publish,
      p_reviewed: operation.reviewed,
    });
    if (result.error)
      throw new LiveError(
        result.error.message.includes("CONFLICT")
          ? 409
          : result.error.message.includes("NOT_READY")
            ? 409
            : 403,
        "La grabación aún necesita revisión o sus permisos cambiaron.",
      );
  }
  if (operation.type === "play") {
    if (!canManage && !policy?.replay_enabled)
      throw new LiveError(403, "Esta repetición aún no está habilitada.");
    const run = checked(
      await db
        .from("live_recording_runs")
        .select("id,session_id,status,published")
        .eq("id", operation.run_id)
        .eq("session_id", sessionId)
        .maybeSingle(),
    );
    if (!run || run.status !== "ready" || (!run.published && !canManage))
      throw new LiveError(
        403,
        "Esta grabación no está disponible para tu curso.",
      );
    const files =
      checked(
        await db
          .from("live_recording_files")
          .select("id,object_key,duration_seconds,status")
          .eq("run_id", run.id)
          .order("starts_at")
          .limit(101),
      ) || [];
    if (
      !files.length ||
      files.length > 100 ||
      files.some((f) => f.status !== "stored" || !f.object_key)
    )
      throw new LiveError(409, "La edición no está completa.");
    const expiresAt = Date.now() + 120000;
    const urls = checked(
      await ctx.db.storage.from(RECORDING_BUCKET).createSignedUrls(
        files.map((f) => f.object_key!),
        120,
      ),
    );
    if (
      !urls ||
      urls.length !== files.length ||
      urls.some((url) => url.error || !url.signedUrl) ||
      files.some((file) => !urls.some((url) => url.path === file.object_key))
    )
      throw new LiveError(503, "No se pudo preparar la reproducción.");
    const fresh = await liveActorContext(ctx.userId, ctx.orgId);
    const access = await recordingAccess(fresh, sessionId);
    const currentPolicy = checked(
      await recordingDb(fresh.db)
        .from("live_recording_policies")
        .select("replay_enabled")
        .eq("organization_id", ctx.orgId)
        .maybeSingle(),
    );
    if (!access.canManage && !currentPolicy?.replay_enabled)
      throw new LiveError(403, "Esta repetición dejó de estar disponible.");
    const current = checked(
      await recordingDb(fresh.db)
        .from("live_recording_runs")
        .select("status,published")
        .eq("id", run.id)
        .maybeSingle(),
    );
    if (
      !current ||
      current.status !== "ready" ||
      (!current.published && !access.canManage)
    )
      throw new LiveError(403, "El acceso a la grabación cambió.");
    return recordingResponseSchema.parse({
      playback: {
        session_id: sessionId,
        user_id: ctx.userId,
        run_id: run.id,
        expires_at: new Date(expiresAt).toISOString(),
        segments: files.map((file) => ({
          id: file.id,
          url: urls.find((url) => url.path === file.object_key)!.signedUrl,
          duration_seconds: file.duration_seconds || 0,
        })),
      },
    });
  }
  const preference = canManage
    ? checked(
        await db
          .from("live_recording_preferences")
          .select("requested,revision")
          .eq("session_id", sessionId)
          .maybeSingle(),
      )
    : null;
  let query = db
    .from("live_recording_runs")
    .select(RECORDING_RUN_COLUMNS)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (!canManage) query = query.eq("published", true).eq("status", "ready");
  const runs =
    !canManage && !policy?.replay_enabled ? [] : checked(await query) || [];
  const files = runs.length
    ? checked(
        await db
          .from("live_recording_files")
          .select("run_id,status,duration_seconds")
          .in(
            "run_id",
            runs.map((r) => r.id),
          )
          .limit(10000),
      ) || []
    : [];
  const fresh = await liveActorContext(ctx.userId, ctx.orgId);
  const access = await recordingAccess(fresh, sessionId);
  if (access.canManage !== canManage)
    throw new LiveError(403, "Los permisos de la grabación cambiaron.");
  const response = recordingResponseSchema.parse({
    recording_snapshot: {
      session_id: sessionId,
      user_id: ctx.userId,
      required: true,
      availability: runs.length
        ? "available"
        : canManage && session.status === "ended"
          ? "missing"
          : "prepared",
      requested: preference?.requested || false,
      revision: preference?.revision || 0,
      can_manage: canManage,
      runs: runs.map((run) => ({
        id: run.id,
        status: run.status,
        coverage: run.coverage,
        published: run.published,
        publication_revision: run.publication_revision,
        created_at: run.created_at,
        segments: files.filter(
          (f) => f.run_id === run.id && f.status === "stored",
        ).length,
        duration_seconds: files
          .filter((f) => f.run_id === run.id)
          .reduce((sum, f) => sum + (f.duration_seconds || 0), 0),
      })),
    },
  });
  return response;
}
