# Sistema de cambio y restablecimiento de contraseña (SofLIA)

> Documento de referencia para replicar el manejo de contraseñas en los demás
> sistemas del ecosistema. Los perfiles viven en SofLIA, así que **toda
> contraseña se gestiona aquí**. Este documento describe el modelo de
> autenticación, las operaciones, el envío de correos, la validación, la
> seguridad, las tablas y la configuración necesaria.

---

## 1. Modelo de autenticación (clave para entender todo)

**La fuente de verdad de las contraseñas es Supabase Auth (`auth.users`).** No se
guardan hashes propios para usuarios nuevos.

Existe una tabla legacy `public.users` con una columna `password_hash` (del
sistema anterior). El sistema **puentea** ambos mundos:

- Cuando un usuario legacy (tiene `password_hash` pero aún no existe en
  `auth.users`) cambia o restablece su contraseña, se crea automáticamente su
  usuario en Supabase Auth **con el mismo `id`** (ver
  `apps/web/src/features/auth/services/supabase-auth-bridge.service.ts` →
  `ensureSupabaseAuthUserForLegacyProfile` / `...RecordForLegacyProfile`).
- **Tras cualquier cambio/restablecimiento, `public.users.password_hash` se
  pone en `NULL`.** A partir de ahí Supabase Auth es el único dueño de la
  contraseña.

Implicación para otros sistemas: si comparten el **mismo proyecto de Supabase**,
comparten `auth.users`. La forma más simple de implementar contraseñas en otro
sistema es usar el **SDK de Supabase Auth directamente** (mismas operaciones)
replicando las reglas de validación de la sección 4.

### Clientes Supabase usados
- `createAdminClient()` (`lib/supabase/admin.ts`) — service role, **bypassa RLS**.
  Solo server-side. Para leer/escribir `public.users`, operar `auth.admin.*`, etc.
- `createAuthActionClient()` (`lib/supabase/auth-server.ts`) — cliente ligado a
  cookies/sesión, usado en server actions para `signInWithPassword`,
  `updateUser`, `resetPasswordForEmail`, `getUser`.
- `createClient()` (browser, `lib/supabase/client.ts`) — en el formulario de
  reset para canjear el código de recuperación (`exchangeCodeForSession`) y leer
  la sesión.

---

## 2. Las tres operaciones

### 2.A Cambio autenticado (usuario con sesión)
**Endpoint REST:** `PUT /api/profile/password`
(`apps/web/src/app/api/profile/password/route.ts`)

**Body** (validado con `passwordChangeSchema`, `.../password/schema.ts`):
```jsonc
{ "currentPassword": "string", "newPassword": "string" }
```
Reglas: `currentPassword` requerido y sin espacios; `newPassword` cumple
`passwordSchema` (sección 4), sin espacios y **distinta** de la actual.

**Flujo:**
1. `SessionService.getCurrentUser()` → 401 si no hay sesión.
2. Lee el perfil en `public.users` (admin client).
3. **Breach check** HIBP de `newPassword` (sección 4).
4. `ensureSupabaseAuthUserForLegacyProfile(perfil)` (crea/asegura el Auth user).
5. **Verifica la contraseña actual**: `authClient.auth.signInWithPassword({ email, currentPassword })`;
   si falla o el `user.id` no coincide → `INVALID_CURRENT_PASSWORD`.
6. `authClient.auth.updateUser({ password: newPassword })`.
7. `public.users.password_hash = NULL`.
8. **Revoca sesiones**: `refresh_tokens` (is_revoked) + `user_session` (revoked).
9. Notificación in-app (best-effort, `AutoNotificationsService.notifyPasswordChanged`).

**Respuesta:** `{ success: true, message }`.
**Errores** (`apiError(code, msg, status)`): `UNAUTHENTICATED` (401),
`USER_NOT_FOUND` (404), `NO_LOCAL_EMAIL` (400), `PASSWORD_BREACHED` (400),
`INVALID_CURRENT_PASSWORD` (400), `PASSWORD_UPDATE_FAILED` (500),
`INTERNAL_ERROR` (500).

### 2.B Solicitud de restablecimiento ("olvidé mi contraseña")
**Server Action:** `requestPasswordResetAction(formData | { email })`
(`apps/web/src/features/auth/actions/reset-password/request-password-reset.action.ts`)
UI: `app/auth/forgot-password/page.tsx` → `ForgotPasswordForm`.

**Flujo:**
1. **Verificación humana** (captcha) obligatoria (`requireHumanVerification` /
   `HumanVerificationField`).
2. **Rate limit** (sección 5).
3. Busca el usuario por email (admin). **Siempre responde éxito** aunque no
   exista (evita enumeración de usuarios).
4. `ensureSupabaseAuthUserRecordForLegacyProfile(user)`.
5. **`authClient.auth.resetPasswordForEmail(email, { redirectTo: \`${APP_URL}/auth/reset-password?mode=supabase\` })`** →
   **Supabase envía el correo de recuperación** (ver sección 3).
6. `recordSecurityEvent('password-reset-request', ...)`.

**Respuesta:** `{ success: true, message }` o `{ error }`.

### 2.C Aplicar la nueva contraseña (página de reset)
UI: `app/auth/reset-password/page.tsx` → `ResetPasswordForm`
(`features/auth/components/ResetPasswordForm/ResetPasswordForm.tsx`).
El formulario detecta el **modo** por la URL y despacha a la acción correcta:

**Modo `supabase` (ACTIVO)** — query `?mode=supabase`, `?code=...` o `#access_token=...`:
1. Si hay `code`: `supabase.auth.exchangeCodeForSession(code)`; si no, lee la
   sesión de recuperación (`getSession`).
2. `resetSupabaseRecoveryPasswordAction({ newPassword })`
   (`.../reset-supabase-recovery-password.action.ts`):
   - Breach check → `authClient.auth.getUser()` (sesión de recuperación) →
     `auth.updateUser({ password })`.
   - `password_hash = NULL`; revoca `refresh_tokens`, `user_session` y sesiones
     nativas de Supabase Auth; `signOut()`.

**Modo `legacy` (DORMIDO/compatibilidad)** — query `?token=...`:
1. `validateResetTokenAction(token)` → `resetPasswordAction({ token, newPassword })`
   (`.../reset-password.action.ts` + `reset-password.db.ts`):
   - Lee `password_reset_tokens` → valida no usado/no expirado →
     `admin.auth.admin.updateUserById(userId, { password })` → `password_hash = NULL`
     → marca token `used_at` → revoca sesiones.

> **Importante:** hoy **nada genera** tokens en `password_reset_tokens` — el
> correo propio (`emailService.sendPasswordResetEmail`) **no tiene llamadores**.
> El flujo activo de "olvidé mi contraseña" es **100% Supabase recovery (2.B)**.
> El camino por token queda como compatibilidad si llegara un enlace `?token=`.

---

## 3. Envío de correos

### Correo ACTIVO de restablecimiento → **Supabase Auth**
Lo envía Supabase al llamar `resetPasswordForEmail`. Por lo tanto:
- **El contenido/plantilla se configura en el Dashboard de Supabase**
  (Authentication → Email Templates → "Reset Password").
- **El SMTP se configura en Supabase** (Authentication → SMTP Settings), no en
  el código de la app.
- La `redirectTo` debe estar en la **allowlist de Redirect URLs** de Supabase:
  `${NEXT_PUBLIC_APP_URL}/auth/reset-password` (y la de cada otro sistema).

### Correo propio vía nodemailer (LEGACY / dormido + invitaciones)
`apps/web/src/features/auth/services/email.service.ts` (singleton `emailService`):
- `sendPasswordResetEmail(to, resetToken, username)` → enlace
  `/auth/reset-password?token=...`, plantilla
  `email-templates/password-reset.template.ts`. **Sin llamadores hoy.**
- `sendOrganizationInvitationEmail(...)` → **sí se usa** para invitaciones de
  organización (mismo transporte SMTP).
- Transporte: `nodemailer.createTransport` con `SMTP_*` (ver sección 6),
  `from: "SofLIA" <noreply@soflia.ai>`, TLS ≥ 1.2.

> Si un sistema quiere correos de reset **propios** (no los de Supabase), puede
> reutilizar este patrón: generar un token, guardarlo en `password_reset_tokens`
> con `expires_at`, enviar el enlace `?token=` y aplicar con el flujo legacy 2.C.

---

## 4. Validación de contraseña (reglas a replicar)

`apps/web/src/lib/validation/password-security/` → `passwordSchema` (Zod):
- Longitud **mín. 12**, **máx. 128** (`PASSWORD_REQUIREMENTS`).
- Al menos: 1 minúscula, 1 mayúscula, 1 dígito, 1 carácter especial
  (`!@#$%^&*()_+-=[]{}|;:,.<>?`).
- No estar en lista de contraseñas comunes (`isCommonPassword`).
- No tener patrones inseguros (repeticiones/secuencias, `hasDangerousPattern`).
- (En cambio autenticado y schemas de reset) **sin espacios** y **distinta de la
  actual**.

**Breach check (HIBP)** — `features/auth/actions/password-breach-check.server.ts`:
- `validatePasswordIsNotBreached(password)` consulta la API k-anonymity de Have
  I Been Pwned (`api.pwnedpasswords.com/range/{prefijo SHA1}`, `Add-Padding`,
  timeout 3 s). Si aparece en filtraciones → se rechaza.
- Si la API no responde: se omite, salvo `HIBP_PASSWORD_CHECK_MODE=strict`
  (entonces se rechaza). Se aplica en cambio autenticado y en ambos resets.

---

## 5. Seguridad

- **Revocación de sesiones tras cambio/reset**: `refresh_tokens`
  (`is_revoked=true`, `revoked_reason`), `user_session` (`revoked=true`) y
  sesiones nativas de Supabase Auth vía RPC `revoke_auth_sessions(target_user_id)`
  (`revokeSupabaseAuthSessions`).
- **`password_hash → NULL`** siempre tras éxito (migración a Supabase Auth).
- **No enumeración de usuarios**: el "forgot" responde igual exista o no el email.
- **Verificación humana** (captcha) en el "forgot".
- **Rate limiting** (`reset-password.rate-limit.ts`, en memoria por proceso,
  ventana 15 min): `MAX_REQUEST_ATTEMPTS=3` (forgot), `MAX_RESET_ATTEMPTS=5`
  (reset). ⚠️ `getClientIP()` devuelve `'unknown'` → el rate-limit es
  efectivamente **global por proceso**, no por IP; al replicar conviene usar un
  rate-limit por IP/identidad real (p. ej. el `checkRateLimit` de
  `core/lib/rate-limit`).
- **Eventos de seguridad**: `recordSecurityEvent('password-reset-request' | ...)`
  (`lib/security/security-events.ts`).
- El cambio autenticado **re-verifica la contraseña actual** con
  `signInWithPassword` antes de actualizar.

---

## 6. Tablas y variables de entorno

### Tablas
- `auth.users` (Supabase) — **fuente de verdad** de la contraseña.
- `public.users` — perfil legacy; `password_hash` se nulifica tras el cambio.
- `password_reset_tokens` — `{ id, user_id, token, expires_at, used_at, created_at }`
  (flujo legacy por token; ver `schema/tables/password-reset-tokens.table.ts`).
- `refresh_tokens`, `user_session` — sesiones revocadas tras cambio/reset.

### Variables de entorno
| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `createAdminClient` (operaciones admin) |
| `NEXT_PUBLIC_APP_URL` | Base del `redirectTo` del correo (`getEmailAppUrl`, default `http://localhost:3000`) |
| `SMTP_SERVER`/`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`/`SMTP_USER`, `SMTP_PASSWORD`/`SMTP_PASS` | nodemailer (invitaciones / reset legacy) |
| `HIBP_PASSWORD_CHECK_MODE` | `strict` para exigir el chequeo HIBP |

### Configuración en el Dashboard de Supabase
- **SMTP** propio (Auth → SMTP) para que salgan los correos de recuperación.
- **Email template** "Reset Password" (Auth → Email Templates).
- **Redirect URLs** allowlist: `${APP_URL}/auth/reset-password` de **cada**
  sistema del ecosistema.

---

## 7. Cómo implementarlo en otros sistemas

Como todos los sistemas comparten el **mismo proyecto Supabase** (mismo
`auth.users`), la recomendación es **operar contra Supabase Auth directamente** y
replicar las reglas de validación (sección 4) + revocación de sesiones (sección 5):

1. **Olvidé mi contraseña**: `supabase.auth.resetPasswordForEmail(email, { redirectTo: \`${TU_APP_URL}/auth/reset-password\` })`.
   Añade tu `redirectTo` a la allowlist de Supabase. Mantén la no-enumeración,
   el captcha y el rate-limit por IP.
2. **Aplicar reset**: en tu página de reset, canjea el código
   (`exchangeCodeForSession`) y `supabase.auth.updateUser({ password })`. Valida
   con las mismas reglas + HIBP. Revoca sesiones.
3. **Cambio autenticado**: `signInWithPassword(currentPassword)` para verificar →
   `updateUser({ password })` → revoca sesiones.
4. Si tu perfil legacy aún usa `password_hash`, replica el **bridge**
   (`supabase-auth-bridge.service.ts`): crea el Auth user con el mismo `id` y
   luego nulifica `password_hash`.

> Nota de contrato: el "forgot" y el "reset" de SofLIA son **Server Actions de
> Next.js**, no endpoints REST, así que **no son invocables por HTTP** desde otro
> sistema. Solo `PUT /api/profile/password` es REST (y requiere la cookie de
> sesión de SofLIA). Por eso la vía recomendada para otros sistemas es usar el
> SDK de Supabase directamente (arriba). Si se prefiere centralizar en SofLIA,
> habría que **exponer endpoints REST** que envuelvan estas acciones
> (`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`).

---

## 8. Archivos de referencia

| Pieza | Ruta |
|---|---|
| Cambio autenticado (REST) | `apps/web/src/app/api/profile/password/route.ts` (+ `schema.ts`) |
| Solicitud de reset (action) | `apps/web/src/features/auth/actions/reset-password/request-password-reset.action.ts` |
| Reset Supabase recovery (action) | `.../reset-supabase-recovery-password.action.ts` |
| Reset por token legacy (action+db) | `.../reset-password.action.ts`, `.../reset-password.db.ts`, `.../validate-reset-token.action.ts` |
| Rate limit reset | `.../reset-password.rate-limit.ts` |
| Bridge legacy↔Supabase Auth | `apps/web/src/features/auth/services/supabase-auth-bridge.service.ts` |
| Validación de contraseña | `apps/web/src/lib/validation/password-security/` |
| Breach check (HIBP) | `apps/web/src/features/auth/actions/password-breach-check.server.ts` |
| Correo (nodemailer) | `apps/web/src/features/auth/services/email.service.ts` (+ `email.utils.ts`, `email-templates/password-reset.template.ts`) |
| UI | `app/auth/forgot-password/page.tsx`, `app/auth/reset-password/page.tsx`, `features/auth/components/{ForgotPasswordForm,ResetPasswordForm}` |
| Eventos de seguridad | `apps/web/src/lib/security/security-events.ts` |
</content>
