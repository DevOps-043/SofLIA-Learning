-- ============================================================================
-- Eliminar de `users` las columnas de autenticación legacy.
--
-- ⚠️ ORDEN OBLIGATORIO: DESPLEGAR PRIMERO EL CÓDIGO, LUEGO ESTA MIGRACIÓN.
--    PostgREST rechaza la consulta ENTERA si un SELECT nombra una columna que
--    no existe. Si se borra la columna antes de desplegar, el LOGIN devuelve
--    500 al instante. Es exactamente lo que pasó con `type_rol`.
--
-- ── password_hash ───────────────────────────────────────────────────────────
-- La contraseña la guarda Supabase Auth en `auth.users.encrypted_password`.
-- Esta columna solo alimentaba el fallback bcrypt legacy, ya eliminado del
-- código.
--
-- COMPROBADO ANTES DE BORRAR (esta era la única acción irreversible del plan):
--
--   SELECT count(*) FROM public.users u
--   LEFT JOIN auth.users a ON a.id = u.id
--   WHERE a.id IS NULL OR a.encrypted_password IS NULL OR a.encrypted_password = '';
--   -> 0 filas.
--
-- Es decir: los 30 usuarios tienen credenciales nativas y NADIE depende ya del
-- hash legacy. Si esa consulta hubiera devuelto una sola fila, esa persona
-- habría perdido el acceso a la plataforma sin vuelta atrás.
--
-- ── oauth_provider / oauth_provider_id ──────────────────────────────────────
-- 0 filas con valor. El proveedor de acceso (Google/Microsoft) lo gestiona
-- Supabase Auth en `auth.identities`. Estas columnas nunca se rellenaron: el
-- panel de administración mostraba "local" para todo el mundo, incluso para
-- quien entraba con Google.
--
-- ── ROLLBACK ────────────────────────────────────────────────────────────────
-- La ESTRUCTURA se recupera con el SQL de abajo, pero los HASHES no: son datos.
-- No hace falta recuperarlos —Supabase Auth es la fuente de verdad— pero conste
-- que esta migración es la única del lote que destruye datos, no solo esquema.
-- ============================================================================

ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE public.users DROP COLUMN IF EXISTS oauth_provider;
ALTER TABLE public.users DROP COLUMN IF EXISTS oauth_provider_id;


-- ── ROLLBACK (solo estructura) ──────────────────────────────────────────────
-- ALTER TABLE public.users ADD COLUMN password_hash text
--   CHECK (password_hash IS NULL OR password_hash ~* '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$');
-- ALTER TABLE public.users ADD COLUMN oauth_provider character varying;
-- ALTER TABLE public.users ADD COLUMN oauth_provider_id character varying;
