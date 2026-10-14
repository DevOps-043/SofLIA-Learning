import "server-only";
import { z } from "zod";
import type { LiveDatabase } from "../database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@/lib/supabase/types";
import { checked, LiveError } from "../errors";
import { recordingDb } from "./database";
export async function readZoomWebhookBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new LiveError(400, "Webhook vacío.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (
      let result = await reader.read();
      !result.done;
      result = await reader.read()
    ) {
      bytes += result.value.byteLength;
      if (bytes > 1024 * 1024)
        throw new LiveError(413, "Webhook demasiado grande.");
      chunks.push(result.value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return Buffer.concat(chunks).toString("utf8");
}

export const zoomRecordingFileSchema = z
  .object({
    id: z.string().min(1).max(256),
    file_type: z.string(),
    file_size: z.number().int().nonnegative().max(53687091200),
    recording_type: z.string().max(100),
    recording_start: z.string().datetime({ offset: true }),
    recording_end: z.string().datetime({ offset: true }),
    status: z.string(),
    download_url: z.string().url().max(8192).optional(),
  })
  .passthrough();
export const recordingEventSchema = z
  .object({
    event: z.enum([
      "recording.started",
      "recording.stopped",
      "recording.paused",
      "recording.resumed",
      "recording.completed",
    ]),
    payload: z
      .object({
        account_id: z.string().min(1),
        object: z
          .object({
            id: z.union([z.string(), z.number().int()]),
            uuid: z.string().min(1).max(256),
            host_id: z.string().min(1),
            start_time: z.string().datetime({ offset: true }).optional(),
            recording_files: z
              .array(zoomRecordingFileSchema)
              .max(1000)
              .optional(),
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough();
const layouts = [
  "shared_screen_with_speaker_view",
  "shared_screen_with_speaker_view(CC)",
  "shared_screen_with_gallery_view",
  "shared_screen",
  "active_speaker",
  "gallery_view",
  "host_video",
];
export function selectRecordingFiles(
  files: z.infer<typeof zoomRecordingFileSchema>[],
) {
  const videos = files.filter(
    (f) => f.file_type === "MP4" && f.status === "completed" && f.file_size > 0,
  );
  const layout = layouts.find((type) =>
    videos.some((f) => f.recording_type === type),
  );
  if (!layout) return [];
  const selected = videos
    .filter((f) => f.recording_type === layout)
    .sort(
      (a, b) => Date.parse(a.recording_start) - Date.parse(b.recording_start),
    );
  if (selected.length > 100)
    throw new LiveError(
      400,
      "La grabación contiene demasiados segmentos para procesarla automáticamente.",
    );
  return selected;
}
export async function ingestRecordingEvent(
  db: SupabaseClient<LiveDatabase>,
  input: unknown,
) {
  const event = recordingEventSchema.parse(input);
  const object = event.payload.object;
  if (event.payload.account_id !== process.env.ZOOM_ACCOUNT_ID)
    throw new LiveError(403, "Cuenta de grabación no autorizada.");
  const session =
    checked(
      await db
        .from("live_sessions")
        .select("id")
        .eq("zoom_meeting_id", String(object.id))
        .maybeSingle(),
    ) ||
    checked(
      await db
        .from("live_sessions")
        .select("id")
        .eq("zoom_webinar_id", String(object.id))
        .maybeSingle(),
    );
  if (!session)
    throw new LiveError(
      404,
      "La grabación no pertenece a una sesión registrada.",
    );
  const credentials = checked(
    await db
      .from("live_zoom_credentials")
      .select("host_id")
      .eq("session_id", session.id)
      .maybeSingle(),
  );
  if (credentials?.host_id !== object.host_id)
    throw new LiveError(403, "Anfitrión de grabación no autorizado.");
  const files = selectRecordingFiles(object.recording_files || []).map(
    (file) => ({
      provider_file_id: file.id,
      layout: file.recording_type,
      starts_at: file.recording_start,
      ends_at: file.recording_end,
      expected_bytes: file.file_size,
    }),
  );
  const result = await recordingDb(db).rpc("live_recording_ingest", {
    p_session: session.id,
    p_account: event.payload.account_id,
    p_host: object.host_id,
    p_uuid: object.uuid,
    p_event: event.event,
    p_start: object.start_time || null,
    p_files: files as unknown as Json,
  });
  if (result.error)
    throw new LiveError(
      503,
      "No se pudo conservar el evento de grabación para reintento.",
    );
}
export async function queueEndedRecordings(
  db: SupabaseClient<LiveDatabase>,
  sessionId: string,
  endedAt: string,
) {
  checked(
    await recordingDb(db).rpc("live_recording_session_end", {
      p_session: sessionId,
      p_end: endedAt,
    }),
  );
}
