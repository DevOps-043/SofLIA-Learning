# Supabase Auth UUID Migration Runbook

## Objetivo

Migrar usuarios legacy desde `public.users` a Supabase Auth conservando exactamente el mismo UUID:

- `auth.users.id = public.users.id`
- `public.users` queda como perfil y autorizacion de aplicacion
- `password_hash` deja de escribirse en altas nuevas
- OAuth custom se mantiene como puente temporal

## Orden recomendado

1. Congelar altas nuevas o enrutar altas nuevas por el flujo ya migrado.
2. Ejecutar auditoria en staging:

   ```bash
   npm run auth:migrate-legacy -- --audit
   ```

3. Corregir bloqueadores antes de importar:
   - emails vacios
   - emails duplicados
   - usernames duplicados por normalizacion
   - `password_hash` vacios o invalidos en usuarios con password local
4. Ejecutar dry-run por lote:

   ```bash
   npm run auth:migrate-legacy -- --limit=50
   ```

5. Ejecutar importacion piloto:

   ```bash
   npm run auth:migrate-legacy -- --apply --limit=50
   ```

   Para precargar tambien usuarios OAuth/passwordless sin password local:

   ```bash
   npm run auth:migrate-legacy -- --apply --include-passwordless
   ```

6. Validar UUIDs:

   ```sql
   select count(*) as mismatches
   from public.users u
   left join auth.users au on au.id = u.id
   where au.id is null
     and u.password_hash is not null;
   ```

7. Validar login, `auth.uid()` y bloqueo de usuarios baneados.
8. Aplicar `supabase/migrations/20260520120000_supabase_auth_uuid_bridge.sql`.
9. Repetir importacion completa en produccion durante ventana controlada.
10. Validar la FK en una migracion posterior cuando `mismatches = 0`.

## Estado de implementacion en codigo

- Registro publico, alta admin, alta business e importacion CSV crean primero `auth.users` con UUID definido por la app y despues completan `public.users`.
- Login por password intenta Supabase Auth primero; si el usuario legacy aun no existe en Auth, el bridge lo crea con `password_hash` y el mismo UUID.
- Login con MFA valida primero el password legacy para emitir el reto, y despues de verificar TOTP intenta crear sesion nativa con Supabase Auth. El fallback a `user_session`/`refresh_tokens` queda solo para errores transitorios del bridge durante rollout.
- Middleware/proxy de rutas protegidas resuelve primero `supabase.auth.getUser()` y despues usa cookies legacy solo como compatibilidad.
- Cambio de password de perfil actualiza Supabase Auth y limpia `public.users.password_hash`.
- Solicitudes nuevas de reset usan `supabase.auth.resetPasswordForEmail`.
- La pagina `/auth/reset-password` acepta links nuevos de Supabase Auth y links legacy `?token=...`.
- Los tokens legacy `password_reset_tokens` quedan solo como compatibilidad para correos ya emitidos.
- OAuth custom usa `oauth_accounts` como puente y crea/vincula `auth.users` con el mismo UUID, sin migrar todavia a proveedores OAuth nativos de Supabase.
- Borrado admin/business elimina tambien el usuario en Supabase Auth para evitar `auth.users` huerfanos.
- Revocacion admin, reset password y solicitud de borrado llaman `revoke_auth_sessions(user_id)` para invalidar sesiones nativas de Supabase Auth.

## Configuracion requerida en Supabase

- Authentication > URL Configuration:
  - Site URL: `NEXT_PUBLIC_APP_URL`
  - Redirect URL permitida: `NEXT_PUBLIC_APP_URL/auth/reset-password`
- Authentication > Email Templates:
  - Recovery debe apuntar al redirect configurado por la app.
- Authentication > Providers:
  - Email/password habilitado.
  - Google/Microsoft nativos siguen pendientes hasta la fase de corte OAuth.
- Rollout flags:
  - `AUTH_LEGACY_SESSION_FALLBACK_ENABLED=true` o sin definir mantiene el fallback temporal a `user_session`/`refresh_tokens`.
  - `AUTH_LEGACY_SESSION_FALLBACK_ENABLED=false` corta nuevas sesiones legacy si Supabase Auth no puede iniciar sesion. Usarlo primero en staging cuando el importador ya haya cubierto usuarios activos.

## Reset password

Flujo nuevo:

1. El usuario solicita reset en `/auth/forgot-password`.
2. El servidor resuelve `public.users` con service role, crea/vincula `auth.users` si falta y llama `resetPasswordForEmail`.
3. Supabase envia el correo de recovery.
4. `/auth/reset-password?mode=supabase` valida la sesion/codigo de recovery.
5. El server action actualiza password en Supabase Auth, limpia `password_hash` y revoca sesiones legacy.

Flujo legacy:

- `/auth/reset-password?token=...` sigue funcionando solo para enlaces antiguos almacenados en `password_reset_tokens`.
- No se deben crear nuevos registros en `password_reset_tokens` despues del cutover.

## Usuarios OAuth legacy

Por defecto el importador por lotes solo importa usuarios con password local valida.
Con `--include-passwordless`, tambien crea registros Auth sin password para usuarios OAuth legacy.
Los usuarios OAuth legacy restantes se vinculan por el puente temporal:

- si existe `public.users.id`, se crea/vincula `auth.users.id` con el mismo UUID
- no se permite generar un UUID nuevo para el mismo perfil
- `oauth_accounts` se mantiene hasta cortar Google/Microsoft a Supabase Auth

## Criterios de salida de fase 2

- usuarios activos inician sesion con Supabase Auth
- no hay escrituras nuevas a `public.users.password_hash`
- no se crean sesiones nuevas en `user_session` o `refresh_tokens`, salvo OAuth custom o fallback de bridge monitoreado mientras dure el rollout
- no se crean nuevos registros en `password_reset_tokens`
- `auth.uid()` resuelve el mismo UUID que las tablas de negocio

## RLS primera ola

La migracion `20260521100000_rls_direct_user_activity_phase1.sql` activa RLS en tablas de actividad directa con dos reglas:

- `auth.uid() = user_id` para acceso del propietario.
- lectura para `owner`/`admin` activo de la organizacion cuando la fila tiene `organization_id` y el usuario objetivo sigue activo en esa organizacion.

`user_notifications` queda incluida con restricciones extra: los usuarios autenticados pueden leer y borrar solo su inbox, y solo pueden actualizar `status`, `read_at` y `updated_at`. No pueden insertar notificaciones ni alterar titulo/mensaje/metadata. La creacion de notificaciones del sistema/admin usa `getSystemNotificationClient()` con `service_role`.

Orden seguro:

1. Verificar dashboards business/reportes en staging con usuario Business y BusinessUser.
2. Verificar Study Planner completo con usuario final.
3. Verificar inbox, marcar leidas, archivar, borrar y actividad reciente admin.
4. Extender la misma politica por membresia a tablas multi-tenant restantes en una segunda ola.

## Consultas de verificacion

Usuarios legacy sin Auth:

```sql
select count(*) as users_without_auth
from public.users u
left join auth.users au on au.id = u.id
where au.id is null;
```

Usuarios Auth sin perfil:

```sql
select count(*) as auth_without_profile
from auth.users au
left join public.users u on u.id = au.id
where u.id is null;
```

Passwords legacy pendientes:

```sql
select count(*) as users_with_legacy_password_hash
from public.users
where password_hash is not null;
```

Sesiones legacy creadas despues del cutover:

```sql
select 'user_session' as table_name, count(*) as total
from public.user_session
where issued_at >= timestamptz '2026-05-20 00:00:00+00'
union all
select 'refresh_tokens', count(*)
from public.refresh_tokens
where created_at >= timestamptz '2026-05-20 00:00:00+00'
union all
select 'password_reset_tokens', count(*)
from public.password_reset_tokens
where created_at >= timestamptz '2026-05-20 00:00:00+00';
```

## Rollback operativo

- Antes de validar la FK, el rollback principal es volver al fallback legacy de login.
- Si una alta nueva falla al crear perfil, el codigo elimina el usuario Auth recien creado.
- Si una importacion falla por lote, revisar `errors` del script y reintentar; el script es idempotente por `auth.users.id`.
