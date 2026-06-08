BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: PGRST203 al emitir certificados (CERTIFICATE_GENERATION_FAILED / 500).
--
-- Causa: existian DOS overloads de `certificate_hash_immutable` con los MISMOS
-- nombres de parametro pero distinto orden/tipos:
--   (a) CANONICA  : (p_certificate_id uuid, p_certificate_url text, p_course_id uuid,
--                    p_enrollment_id uuid, p_issued_at timestamptz, p_user_id uuid)
--                    -> tipos (uuid, text, uuid, uuid, timestamptz, uuid)
--   (b) OBSOLETA  : (p_user_id uuid, p_course_id uuid, p_enrollment_id uuid,
--                    p_certificate_id uuid, p_issued_at timestamptz, p_certificate_url text)
--                    -> tipos (uuid, uuid, uuid, uuid, timestamptz, text)
--
-- La RPC se llama con parametros NOMBRADOS y ambas firmas tienen esos 6 nombres,
-- por lo que PostgREST no puede elegir candidato -> PGRST203 -> falla la emision.
-- La firma (b) quedo huerfana en la BD (la migracion canonica se edito despues de
-- aplicarse; `CREATE OR REPLACE` no reemplaza una firma de tipos distinta, crea
-- un overload nuevo).
--
-- Solucion: eliminar SOLO la firma obsoleta (b) y reafirmar la canonica (a).
-- Las posiciones 2 (text vs uuid) y 6 (uuid vs text) las hacen inequivocas, asi
-- que el DROP no afecta a la canonica. Los certificados existentes conservan su
-- `certificate_hash` (la verificacion es por busqueda del valor, no recalculo).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Elimina el overload obsoleto (firma de tipos exacta de la version (b)).
DROP FUNCTION IF EXISTS public.certificate_hash_immutable(uuid, uuid, uuid, uuid, timestamptz, text);

-- Reafirma la version canonica (idempotente: la deja como unica definicion).
CREATE OR REPLACE FUNCTION public.certificate_hash_immutable(
  p_certificate_id uuid,
  p_certificate_url text,
  p_course_id uuid,
  p_enrollment_id uuid,
  p_issued_at timestamptz,
  p_user_id uuid
) RETURNS text
LANGUAGE sql
IMMUTABLE STRICT SECURITY DEFINER
AS $$
  SELECT encode(
    digest(
      p_certificate_id::text || '|' ||
      p_user_id::text          || '|' ||
      p_course_id::text        || '|' ||
      p_enrollment_id::text    || '|' ||
      p_issued_at::text        || '|' ||
      p_certificate_url,
      'sha256'
    ),
    'hex'
  );
$$;

GRANT EXECUTE ON FUNCTION public.certificate_hash_immutable(uuid, text, uuid, uuid, timestamptz, uuid)
  TO authenticated, service_role, anon;

COMMIT;
