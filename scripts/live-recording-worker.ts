import { createAdminClient } from "../apps/web/src/lib/supabase/admin";
import { processRecordingJob } from "../apps/web/src/features/live/recordings/worker.server";
import { reconcileRecordings } from "../apps/web/src/features/live/recordings/reconcile.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LiveDatabase } from "../apps/web/src/features/live/database.types";
import { setTimeout as sleep } from "node:timers/promises";
async function main() {
  if (process.argv.includes("--help")) {
    console.log(
      "Uso: npm run recordings:worker -- [--once]. Credenciales gestionadas por el entorno; no se cargan archivos .env.",
    );
    return;
  }
  const abort = new AbortController();
  process.once("SIGINT", () => abort.abort());
  process.once("SIGTERM", () => abort.abort());
  const db = createAdminClient(
    20000,
  ) as unknown as SupabaseClient<LiveDatabase>;
  const once = process.argv.includes("--once");
  let nextReconciliation = 0;
  while (!abort.signal.aborted) {
    try {
      if (Date.now() >= nextReconciliation) {
        await reconcileRecordings(db, abort.signal);
        nextReconciliation = Date.now() + 300000;
      }
      const processed = await processRecordingJob(db, abort.signal);
      if (once) break;
      if (!processed) await sleep(10000, undefined, { signal: abort.signal });
    } catch {
      if (abort.signal.aborted) break;
      console.error(
        "[Grabaciones] Operación pendiente de revisión o reintento.",
      );
      if (once) {
        process.exitCode = 1;
        break;
      }
      await sleep(30000, undefined, { signal: abort.signal }).catch(() => {});
    }
  }
}
void main().catch(() => {
  console.error(
    "[Grabaciones] El worker no pudo iniciar. Revisa configuración y dependencias.",
  );
  process.exitCode = 1;
});
