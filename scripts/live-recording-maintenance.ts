import { createAdminClient } from "../apps/web/src/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LiveDatabase } from "../apps/web/src/features/live/database.types";
import { checked, LiveError } from "../apps/web/src/features/live/errors";
import {
  platformHostIds,
  preflightRecordingHost,
  verifyAutomaticRecording,
} from "../apps/web/src/features/live/recordings/platform-hosts.server";
import { zoomRequest } from "../apps/web/src/features/live/zoom.server";
import { purgeRecordingArchive } from "../apps/web/src/features/live/recordings/retention.server";
import { cleanRecordingSpool } from "../apps/web/src/features/live/recordings/spool.server";
async function main() {
  if (process.argv.includes("--help")) {
    console.log(
      "Uso: npm run recordings:maintenance -- [--apply --confirm] [--purge | --spool-clean]. Sin opciones: auditoría sin modificaciones.",
    );
    return;
  }
  const db = createAdminClient(
    20000,
  ) as unknown as SupabaseClient<LiveDatabase>;
  const apply =
    process.argv.includes("--apply") && process.argv.includes("--confirm");
  if (process.argv.includes("--spool-clean")) {
    if (!apply) throw new Error("La limpieza requiere --apply --confirm.");
    console.log(
      "Archivos temporales retirados: " + (await cleanRecordingSpool(db)),
    );
  } else if (process.argv.includes("--purge")) {
    if (!apply)
      throw new Error(
        "La purga requiere --apply --confirm y políticas aprobadas.",
      );
    console.log("Archivos retirados: " + (await purgeRecordingArchive(db)));
  } else {
    for (const host of platformHostIds())
      await preflightRecordingHost(host, false);
    let after = "";
    for (let page = 0; page < 100; page++) {
      let query = db
        .from("live_sessions")
        .select("id,session_type,zoom_meeting_id,zoom_webinar_id")
        .eq("status", "scheduled")
        .order("id")
        .limit(100);
      if (after) query = query.gt("id", after);
      const sessions = checked(await query) || [];
      for (const session of sessions) {
        const credentials = checked(
          await db
            .from("live_zoom_credentials")
            .select("host_id")
            .eq("session_id", session.id)
            .single(),
        );
        if (!credentials) continue;
        await preflightRecordingHost(
          credentials.host_id,
          session.session_type === "webinar",
        );
        try {
          await verifyAutomaticRecording(session, credentials.host_id);
          console.log(session.id + ": grabación configurada");
        } catch (error) {
          if (!apply) {
            console.log(
              session.id + ": requiere revisión de acceso o configuración",
            );
            continue;
          }
          if (!(error instanceof LiveError) || error.status !== 503)
            throw error;
          const id =
            session.session_type === "webinar"
              ? session.zoom_webinar_id
              : session.zoom_meeting_id;
          await zoomRequest(
            `/${session.session_type === "webinar" ? "webinars" : "meetings"}/${id}`,
            "PATCH",
            {
              settings:
                session.session_type === "webinar"
                  ? { automatic_recording: "cloud", on_demand: false }
                  : { automatic_recording: "cloud" },
            },
          );
          await verifyAutomaticRecording(session, credentials.host_id);
          console.log(session.id + ": configuración verificada");
        }
      }
      if (!sessions.length || sessions.length < 100) break;
      after = sessions[sessions.length - 1].id;
      if (page === 99)
        throw new Error(
          "La auditoría superó su presupuesto; revisa el conjunto antes de aplicar.",
        );
    }
  }
}
void main().catch(() => {
  console.error(
    "[Grabaciones] El mantenimiento requiere revisión de configuración, permisos o estado.",
  );
  process.exitCode = 1;
});
