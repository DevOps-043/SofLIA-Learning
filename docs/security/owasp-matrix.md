# Matriz OWASP Top 10

Ultima revision tecnica: 2026-08-27.

| ID | Categoria OWASP 2021 | Control actual | Evidencia local | Estado tecnico |
|---|---|---|---|---|
| A01 | Broken Access Control | API central default-deny, roles por superficie, membresia de organizacion, RLS forzado y grants minimos. Tablas de credenciales son exclusivas de `service_role`. | `apps/web/src/proxy/api-route-auth.ts`, `docs/security/rls-matrix.md`, `supabase/migrations/20260827120000_emergency_data_api_lockdown.sql` | Cerrado en codigo; migracion y retest productivo obligatorios |
| A02 | Cryptographic Failures | Tokens firmados fallan cerrados en produccion si falta un secreto fuerte; MFA cifra secretos con AES-256-GCM; politica de rotacion e invalidacion documentada. | `apps/web/src/lib/security/signed-token.ts`, `docs/security/mfa-totp.md`, `docs/security/remediation-2026-08-27.md` | Cerrado en codigo; rotacion por incidente pendiente de operacion |
| A03 | Injection | SQL de aplicacion parametrizado, validacion Zod obligatoria en cuerpos JSON, HTML rico saneado con DOMPurify y prompts delimitados como entrada no confiable. | `scripts/audit-route-validation.ts`, `apps/web/src/lib/sanitize`, `docs/security/xss-audit.md` | Cerrado |
| A04 | Insecure Design | Threat model STRIDE, ownership explicito, deny-by-default, rollback y orden de despliegue definidos. | `docs/security/threat-model.md`, `docs/security/remediation-2026-08-27.md` | Cerrado tecnicamente; firma periodica del owner es control operativo |
| A05 | Security Misconfiguration | CSP enforced con nonce por request, CSRF por `Origin`/`Sec-Fetch-Site`, CORS allowlist, limites de cuerpo y endpoints diagnosticos eliminados. | `apps/web/middleware.ts`, `apps/web/src/lib/security/content-security-policy.ts`, `docs/security/csp-enforcement.md` | Cerrado |
| A06 | Vulnerable and Outdated Components | Dependencias actualizadas, overrides centralizados y CI de secretos/dependencias. | `package.json`, `package-lock.json`, `docs/security/dependency-policy.md` | `npm audit --audit-level=low`: 0 vulnerabilidades conocidas |
| A07 | Identification and Auth Failures | Lockout, HIBP, passwords 12+, OAuth state, MFA TOTP/recovery, sesiones revocables y endpoints de auth explicitamente catalogados. | `docs/security/auth-policy.md`, `docs/security/mfa-totp.md`, `apps/web/src/proxy/api-route-auth.ts` | Cerrado; obligatoriedad MFA por rol es decision de rollout |
| A08 | Software and Data Integrity Failures | Checksums/signing, backup/restore, migracion con rollback y supply-chain audit. | `docs/security/data-integrity-backups.md`, `docs/security/backup-restore-drill.md`, `docs/security/remediation-2026-08-27.md` | Cerrado tecnicamente; restore drill real es control operativo recurrente |
| A09 | Security Logging and Monitoring Failures | Audit log append-only, eventos sin payload sensible, correlacion, alertas y jobs programados. | `supabase/migrations/20260518123000_phase5_security_privacy.sql`, `apps/web/src/lib/security/security-events.ts`, `netlify/functions/process-security-alerts.ts`, `netlify.toml` | Cerrado |
| A10 | SSRF | Fetch server-side auditado; URLs de usuario pasan por HTTPS, allowlist y rechazo DNS de IP privada. Transcodificacion usa bucket/path autorizado, no `sourceUrl` externo. | `docs/security/ssrf-audit.md`, `apps/web/src/lib/security/safe-fetch.ts`, `netlify/functions/transcode-video-background/job-processor.ts` | Cerrado |

## Decision

La cobertura tecnica OWASP queda implementada en el repositorio. Esto no equivale a
declarar contenido un incidente real: A01 y A02 solo quedan contenidos en produccion
despues de aplicar la migracion, revocar sesiones/tokens, rotar secretos posiblemente
expuestos y ejecutar las pruebas negativas entre dos usuarios y dos organizaciones.
Las firmas de threat model, los restore drills y el rollout obligatorio de MFA son
controles operativos recurrentes, no deuda de implementacion.
