-- Tickets de un solo uso para el inicio de sesion federado del escritorio.
--
-- Pulse Hub no puede autenticar con signInWithPassword a las cuentas creadas
-- por OAuth, porque se crean en auth.users sin contrasena. Learning emite aqui
-- un ticket al terminar su propio SSO y el escritorio lo canjea por una sesion
-- Supabase legitima.
--
-- El ticket vuelve al escritorio por un esquema de URL propio, que cualquier
-- aplicacion local puede registrar. Por eso se guarda solo su hash y el canje
-- exige ademas el verificador (PKCE S256) que solo posee la instancia que
-- inicio el flujo.
--
-- Gemela documentada en el Hub: database/sofia-learning/migrations/desktop-sso-tickets.sql

CREATE TABLE IF NOT EXISTS public.desktop_sso_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- SHA-256 en hexadecimal del ticket. El valor en claro nunca se persiste.
  token_hash text NOT NULL,
  -- SHA-256 en base64url del verificador generado por el escritorio.
  code_challenge text NOT NULL CHECK (length(btrim(code_challenge)) > 0),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_desktop_sso_tickets_hash
  ON public.desktop_sso_tickets(token_hash);

CREATE INDEX IF NOT EXISTS idx_desktop_sso_tickets_expiracion
  ON public.desktop_sso_tickets(expires_at);

COMMENT ON TABLE public.desktop_sso_tickets IS
  'Tickets de un solo uso que ligan el SSO web de Learning con una sesion de escritorio. Solo el rol de servicio los usa. El ticket en claro nunca se guarda.';

-- RLS activa y SIN politicas: solo el rol de servicio, que no pasa por RLS,
-- puede tocar la tabla. Negar por defecto es intencional.
ALTER TABLE public.desktop_sso_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desktop_sso_tickets FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.desktop_sso_tickets FROM anon, authenticated;

-- Consumo atomico: el bloqueo de fila impide que dos canjes simultaneos del
-- mismo ticket prosperen ambos. La vigencia se evalua con el reloj del servidor.
--
-- Devuelve el desafio para que el backend compare el verificador DESPUES de
-- marcar el consumo: un verificador incorrecto quema el ticket, que es lo
-- deseable frente a quien lo intercepto e intenta adivinar.
CREATE OR REPLACE FUNCTION public.consume_desktop_sso_ticket(p_token_hash text)
RETURNS TABLE (user_id uuid, code_challenge text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.desktop_sso_tickets AS t
  SET consumed_at = now()
  WHERE t.token_hash = p_token_hash
    AND t.consumed_at IS NULL
    AND t.expires_at > now()
  RETURNING t.user_id, t.code_challenge;
$$;

REVOKE ALL ON FUNCTION public.consume_desktop_sso_ticket(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_desktop_sso_ticket(text) TO service_role;

COMMENT ON FUNCTION public.consume_desktop_sso_ticket(text) IS
  'Marca un ticket como consumido y devuelve su usuario y desafio, o ninguna fila si no existe, expiro o ya se uso.';

-- Los tickets vencidos o consumidos no sirven; se conservan un dia por auditoria.
CREATE OR REPLACE FUNCTION public.purge_desktop_sso_tickets()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH eliminados AS (
    DELETE FROM public.desktop_sso_tickets
    WHERE created_at < now() - interval '1 day'
    RETURNING 1
  )
  SELECT count(*) FROM eliminados;
$$;

REVOKE ALL ON FUNCTION public.purge_desktop_sso_tickets() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_desktop_sso_tickets() TO service_role;
