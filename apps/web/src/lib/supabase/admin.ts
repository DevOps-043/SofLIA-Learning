import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Crea un cliente Supabase con service role key (bypass RLS)
 * Solo usar en rutas autorizadas del servidor o jobs administrativos de confianza.
 */
export function createAdminClient(timeoutMs?: number) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no está configurada");
  }
  if (
    timeoutMs !== undefined &&
    (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60000)
  )
    throw new Error("Presupuesto de petición Supabase inválido");

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    ...(timeoutMs
      ? {
          global: {
            fetch: (input: RequestInfo | URL, init?: RequestInit) =>
              fetch(input, {
                ...init,
                signal: AbortSignal.any([
                  ...(init?.signal ? [init.signal] : []),
                  AbortSignal.timeout(timeoutMs),
                ]),
              }),
          },
        }
      : {}),
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
