import "server-only";
import path from "node:path";
import { tmpdir } from "node:os";
import { lstat, readdir, unlink, rmdir } from "node:fs/promises";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LiveDatabase } from "../database.types";
import { recordingDb } from "./database";
import { checked } from "../errors";
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
/** Limpieza administrativa: solo concesiones locales vencidas y archivos reconocidos. */
export async function cleanRecordingSpool(db: SupabaseClient<LiveDatabase>) {
  const root = path.resolve(
    process.env.RECORDING_SPOOL_DIRECTORY ||
      path.join(tmpdir(), "soflia-recordings"),
  );
  const rootInfo = await lstat(root).catch(() => null);
  if (!rootInfo) return 0;
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink())
    throw new Error("El spool debe ser un directorio privado del worker.");
  const store = recordingDb(db);
  let removed = 0;
  for (const lease of await readdir(root)) {
    if (!uuid.test(lease)) continue;
    const directory = path.resolve(root, lease);
    if (path.dirname(directory) !== root)
      throw new Error("Directorio fuera del spool.");
    const info = await lstat(directory);
    if (
      !info.isDirectory() ||
      info.isSymbolicLink() ||
      Date.now() - info.mtimeMs < 48 * 60 * 60 * 1000
    )
      continue;
    if (
      (
        checked(
          await store
            .from("live_recording_jobs")
            .select("run_id")
            .eq("lease_id", lease)
            .eq("status", "running")
            .gt("lease_until", new Date().toISOString())
            .limit(1),
        ) || []
      ).length
    )
      continue;
    for (const name of await readdir(directory)) {
      const id = name.replace(/\.mp4(?:\.etag)?$/, "");
      if (
        !uuid.test(id) ||
        !(name === id + ".mp4" || name === id + ".mp4.etag")
      )
        continue;
      const target = path.resolve(directory, name);
      if (path.dirname(target) !== directory)
        throw new Error("Archivo fuera del spool.");
      const item = await lstat(target);
      if (!item.isFile() || item.isSymbolicLink()) continue;
      const file = checked(
        await store
          .from("live_recording_files")
          .select("run_id")
          .eq("id", id)
          .maybeSingle(),
      );
      if (!file) continue;
      const run = checked(
        await store
          .from("live_recording_runs")
          .select("legal_hold")
          .eq("id", file.run_id)
          .single(),
      );
      if (run?.legal_hold) continue;
      await unlink(target);
      removed++;
    }
    if (!(await readdir(directory)).length) await rmdir(directory);
  }
  return removed;
}
