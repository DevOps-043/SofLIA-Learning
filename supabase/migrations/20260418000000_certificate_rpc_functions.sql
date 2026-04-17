BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Genera un hash SHA-256 determinístico e inmutable para un certificado.
-- Todos los parámetros que identifican unívocamente la emisión forman la cadena a hashear.
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

-- Valida un certificado por su hash público.
-- Retorna los campos que el cliente de verificación y la API esperan.
CREATE OR REPLACE FUNCTION public.validate_certificate(p_hash text)
RETURNS TABLE (
  certificate_id uuid,
  chain_ok       boolean,
  course_title   text,
  is_expired     boolean,
  is_valid       boolean,
  issued_at      timestamptz,
  last_block_at  timestamptz,
  last_op        text,
  user_id        uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT
    c.certificate_id,
    true                                                        AS chain_ok,
    cr.title                                                    AS course_title,
    (c.expires_at IS NOT NULL AND c.expires_at < now())        AS is_expired,
    (
      c.certificate_hash IS NOT NULL AND
      (c.expires_at IS NULL OR c.expires_at >= now())
    )                                                           AS is_valid,
    c.issued_at,
    c.issued_at                                                 AS last_block_at,
    'ISSUE'                                                     AS last_op,
    c.user_id
  FROM public.user_course_certificates c
  JOIN public.courses cr ON cr.id = c.course_id
  WHERE c.certificate_hash = p_hash;
$$;

GRANT EXECUTE ON FUNCTION public.certificate_hash_immutable(uuid, text, uuid, uuid, timestamptz, uuid)
  TO authenticated, service_role, anon;

GRANT EXECUTE ON FUNCTION public.validate_certificate(text)
  TO authenticated, service_role, anon;

COMMIT;
