import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LiveDatabase } from "../database.types";
import { recordingDb } from "./database";
import { checked } from "../errors";
import { removeRecording } from "./storage.server";
function validateKey(key: string, run: string, file: string) {
  const uuid = "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}";
  if (!new RegExp(`^${uuid}/${uuid}/${run}/${file}/${uuid}\\.mp4$`).test(key))
    throw new Error("La ruta de purga no pertenece al archivo de grabaciones.");
}
export async function purgeRecordingArchive(db: SupabaseClient<LiveDatabase>) {
  const store = recordingDb(db);
  let removed = 0;
  const orphans = checked(await store.rpc("live_recording_orphans", {})) || [];
  for (const orphan of orphans) {
    validateKey(orphan.object_key, orphan.run_id, orphan.file_id);
    await removeRecording(orphan.object_key);
    checked(
      await store
        .from("live_recording_artifacts")
        .update({ status: "purged" })
        .eq("object_key", orphan.object_key)
        .eq("status", "purging"),
    );
    removed++;
  }
  const runs = checked(await store.rpc("live_recording_claim_purge", {})) || [];
  for (const run of runs) {
    const files =
      checked(
        await store
          .from("live_recording_files")
          .select("id,object_key")
          .eq("run_id", run.id)
          .eq("status", "stored"),
      ) || [];
    for (const file of files) {
      if (file.object_key) validateKey(file.object_key, run.id, file.id);
      if (file.object_key) await removeRecording(file.object_key);
      checked(
        await store
          .from("live_recording_files")
          .update({ status: "purged", object_key: null })
          .eq("id", file.id),
      );
      if (file.object_key)
        checked(
          await store
            .from("live_recording_artifacts")
            .update({ status: "purged" })
            .eq("object_key", file.object_key),
        );
      removed++;
    }
    checked(
      await store
        .from("live_recording_runs")
        .update({ status: "purged", published: false })
        .eq("id", run.id)
        .eq("status", "purging"),
    );
    checked(
      await store.from("live_recording_audit").insert({
        session_id: run.session_id,
        action: "purga_politica_aprobada",
        revision: run.publication_revision,
      }),
    );
  }
  return removed;
}
