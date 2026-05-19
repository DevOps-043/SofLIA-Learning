# Auth hardening policy

Ultima revision: 2026-05-18

## Objetivo

Reducir credential stuffing, takeover de cuentas privilegiadas, sesiones persistentes comprometidas y filtracion de existencia de usuarios.

## Controles implementados

| Control | Estado | Implementacion |
|---|---|---|
| Lockout login | Activo | 5 intentos fallidos por identificador+IP en 15 min, Redis REST si existe Upstash/Redis y fallback local |
| Rate limit auth | Activo parcial | Proxy rate limits para `/api/auth/*`; server action login protegido por lockout |
| Email enumeration | Activo | Login y reset usan mensajes genericos para credenciales/correos inexistentes |
| Password minimo | Activo | 12 caracteres, mayuscula, minuscula, numero y caracter especial |
| HIBP | Activo | Check k-anonymity SHA-1 prefix contra Have I Been Pwned; no se envia la password completa |
| Token rotation | Activo parcial | Refresh tokens propios con revocacion y expiracion; documentar valores en Supabase dashboard |
| Revocacion de sesiones | Activo | Reset password revoca sesiones; Admin puede revocar sesiones por usuario |
| OAuth state/CSRF | Activo | Callback Google/Microsoft valida cookie `oauth_state` contra `state`; test dedicado en `oauth-callback.service.test.ts` |

## Politica de lockout

- Ventana: 15 minutos.
- Umbral: 5 fallos.
- Scope: hash de `emailOrUsername + IP`.
- Storage: Upstash Redis REST si `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` existen; fallback in-memory solo para dev/single instance.
- Mensaje: no revela si el usuario existe.

## Politica de password

- Minimo 12 caracteres.
- Requiere mayuscula, minuscula, numero y caracter especial.
- Bloquea passwords comunes y patrones peligrosos por validacion local.
- Bloquea passwords encontrados en HIBP cuando el servicio responde.
- Si HIBP no esta disponible, el sistema permite el flujo por disponibilidad. Para fail-closed, configurar `HIBP_PASSWORD_CHECK_MODE=strict`.

## MFA

Roles objetivo: Admin y Business.

Estado: TOTP propio implementado para Admin/Business con secretos cifrados, recovery codes y gate de login por challenge firmado de corta vida. La politica de enforcement es:

- Admin: MFA obligatorio.
- Business owner/admin: MFA obligatorio en login cuando el factor TOTP esta activo.
- BusinessUser/Instructor: MFA opcional.
- Recovery codes: generar y mostrar una sola vez.
- Challenge de login: `MFA_LOGIN_CHALLENGE_SECRET` o `MFA_SECRET_KEY`, minimo 32 caracteres, requerido para emitir retos MFA antes de crear sesion.

No hacer enforcement global en produccion hasta que existan:

- Pantalla de enrolamiento TOTP.
- Recovery codes.
- Excepcion break-glass para al menos dos cuentas Admin.
- Runbook de soporte para perdida de dispositivo.

## Session invalidation

- Usuarios pueden revocar sesiones individuales desde `/api/auth/sessions`.
- Admin puede revocar sesiones de un usuario via `POST /api/admin/users/:id/sessions/revoke`.
- Reset password revoca sesiones activas despues de cambiar password.
- Incidentes P0/P1 deben revocar sesiones del usuario afectado y registrar evento en `security_audit_log` cuando 5.9 este listo.

## OAuth state validation

Requisito: callbacks Google/Microsoft deben validar `state`/CSRF y no confiar en parametros sin verificar.

Estado: implementado y cubierto por pruebas unitarias.

Casos cubiertos:

- `state` ausente rechaza el callback antes de intercambiar tokens.
- `state` invalido rechaza el callback antes de intercambiar tokens.
- `state` valido permite continuar al intercambio de tokens.

## Validaciones QA obligatorias

- 5 fallos de login bloquean el sexto intento hasta que expire la ventana.
- Login con email inexistente y password incorrecta devuelven el mismo mensaje de error.
- Reset password con email inexistente devuelve el mismo mensaje de exito generico.
- Password filtrado por HIBP se rechaza sin registrar la password.
- Admin revoca sesiones de un usuario y los refresh tokens quedan marcados como revocados.
- OAuth callback con `state` ausente o invalido no llama al proveedor de tokens.
