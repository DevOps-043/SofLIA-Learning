# Threat model STRIDE - SofLIA Learning

Ultima revision: 2026-05-18

Alcance: flujos criticos de Auth, file uploads, LIA chat, multi-tenant data access, OAuth Google/Microsoft y pagos/subscripciones.

Cadencia obligatoria: revision cada 6 meses o antes de cualquier cambio mayor en auth, Supabase RLS, storage, integraciones IA, pagos o arquitectura multi-tenant.

Estado de revision: pendiente de firma por Security Owner y Platform Owner. Este documento deja el baseline tecnico listo para revision humana.

## Registro de revision

| Fecha | Reviewer | Rol | Decision | Notas |
|---|---|---|---|---|
| Pendiente | Security Owner | Security | Pendiente | Revision humana requerida para cerrar 5.4 |
| Pendiente | Platform Owner | Platform | Pendiente | Revision humana requerida para cerrar 5.4 |

## Supuestos

- Supabase Auth y Postgres/RLS son controles de plataforma, pero no reemplazan validaciones de aplicacion.
- El service role solo debe ejecutarse en contexto server-side confiable.
- No se usan webhooks propios para integraciones internas; el proyecto opera con REST.
- Los logs no deben persistir passwords, tokens, prompts completos con PII, ni payloads de usuarios.
- Cualquier CSP nueva debe pasar por report-only antes de enforcement.

## Activos criticos

| Activo | Riesgo principal | Control base |
|---|---|---|
| Cuentas Admin/Business | Escalacion de privilegios | MFA, lockout, sesiones revocables, auditoria |
| Datos multi-tenant | Acceso cruzado entre organizaciones | `requireOrgAccess`, RLS, tests de aislamiento |
| Prompts y respuestas LIA | Exposicion de PII e inyeccion de prompt | Sanitizacion, minimizacion, guardrails |
| Archivos subidos | Malware, XSS, contenido activo | MIME/magic bytes, limites, antimalware |
| Tokens OAuth/sesiones | Secuestro de cuenta | state/PKCE, cookies seguras, rotacion |
| Pagos/subscripciones | Fraude, cambios no autorizados | auth por rol, idempotencia, audit log |

## STRIDE por flujo

| Flujo | STRIDE | Amenaza | Prob. | Impacto | Mitigacion actual / requerida | Owner |
|---|---|---|---|---|---|---|
| Auth login/register/reset | Spoofing | Fuerza bruta o credential stuffing contra login | Alta | Alto | Lockout 5 fallos / 15 min Redis-ready, rate limits, mensajes genericos | Security |
| Auth login/register/reset | Information disclosure | Email enumeration por login/reset | Media | Medio | Login devuelve mensaje generico; reset mantiene respuesta uniforme | Security |
| Auth login/register/reset | Tampering | Password debil o filtrado aceptado | Media | Alto | Minimo 12 chars, complejidad, HIBP k-anonymity | Security |
| Auth login/register/reset | Repudiation | No hay rastro de revocacion o incidentes | Media | Alto | Endpoint admin de revocacion; pendiente `security_audit_log` | Platform |
| OAuth Google/Microsoft | Spoofing | Callback sin state/CSRF correcto | Media | Alto | Verificar state en callback y documentar en auth policy | Security |
| OAuth Google/Microsoft | Information disclosure | Tokens OAuth en logs o errores | Baja | Alto | Logger sanitizado; no registrar query/cookies completas | Platform |
| File uploads | Tampering | Extension/MIME falsificados | Alta | Alto | Pendiente magic bytes y antimalware en 5.11 | Platform |
| File uploads | Denial of service | Archivos grandes o muchos uploads | Media | Alto | Rate limit upload, limites de payload, bucket policies | Platform |
| File uploads | Elevation of privilege | Path traversal o overwrite de archivos ajenos | Media | Alto | Sanitizacion de paths y storage por bucket; revisar ownership | Platform |
| LIA chat | Information disclosure | PII en prompt enviada a modelos externos | Media | Alto | Sanitizacion de contexto, minimizacion y redaccion de logs | AI Platform |
| LIA chat | Tampering | Prompt injection que induce acciones mutativas | Alta | Alto | Guardrails, confirmacion para acciones mutativas, tests existentes | AI Platform |
| LIA chat | Denial of service | Abuso de costo por chats IA | Media | Medio | Rate limit AI chat y circuit breakers | Platform |
| Multi-tenant access | Elevation of privilege | Usuario accede datos de otra organizacion | Alta | Critico | RLS, helpers auth, pendiente `requireOrgAccess` masivo | Platform |
| Multi-tenant access | Information disclosure | Query sin filtro `org_id` o `select('*')` | Media | Alto | Auditoria select-star, RLS matrix, tests tenant pendientes | Platform |
| Pagos/subscripciones | Tampering | Cambio de plan no autorizado | Media | Alto | Auth por rol Business/Admin, validacion server-side | Payments |
| Pagos/subscripciones | Repudiation | Cambios sin audit trail | Media | Alto | Pendiente `security_audit_log` y eventos de negocio firmables | Payments |
| Pagos/subscripciones | Denial of service | Reintentos duplican cambios/cargos | Baja | Alto | Requiere idempotency keys donde haya proveedor de pagos | Payments |

## Secure design review checklist

- Auth y roles se validan en servidor, no solo en UI.
- Endpoints multi-tenant filtran por org y validan membership.
- Inputs mutativos usan Zod o validadores equivalentes.
- Respuestas de auth no revelan existencia de cuentas.
- Logs usan `logger` sanitizado y no incluyen payloads sensibles.
- CSP esta en report-only antes de enforcement.
- Migraciones destructivas incluyen rollback documentado.
- Dependencias nuevas pasan por audit/licencias.

## Riesgos residuales

| Riesgo | Estado | Siguiente tarea |
|---|---|---|
| `requireOrgAccess` no aplicado al 100% | Abierto | 5.1 |
| `security_audit_log` aun no creado | Abierto | 5.9 |
| Upload hardening incompleto | Abierto | 5.11 |
| CSP enforcement requiere periodo report-only | En progreso | 5.5 seguimiento |
| MFA Admin/Business requiere habilitacion Supabase/UX | En progreso | 5.7 seguimiento |

## Revision y firmas

| Fecha | Revisor | Cambios | Aprobacion |
|---|---|---|---|
| 2026-05-19 | Security Owner | Pendiente de firma humana sobre baseline STRIDE y MFA/login hardening | Pendiente |
| 2026-05-19 | Platform Owner | Pendiente de cross-review humano sobre tenant isolation, CORS y upload hardening | Pendiente |
