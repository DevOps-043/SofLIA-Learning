# Matriz OWASP Top 10

## Tarea cubierta

TECH_DEBT_REMEDIATION.md 5.0 - Matriz OWASP Top 10 -> estado del proyecto.

| ID | Categoria OWASP 2021 | Estado SofLIA al 2026-05-18 | Evidencia local | Tarea correctora | Estado |
|---|---|---|---|---|---|
| A01 | Broken Access Control | Riesgo alto en SaaS multi-tenant; mitigacion de app formalizada con `requireOrgAccess`. | 120 route files bajo `/api/[orgSlug]`; test estatico exige guard directo/delegado; test unitario cubre denegacion cross-tenant. | 1.5, 2.5, 5.1 | Mitigacion base completada |
| A02 | Cryptographic Failures | Secretos y tokens requieren politica operativa explicita. | Workflow `security-secrets` agregado con Gitleaks y politica de rotacion en `secrets-rotation.md`. | 5.2 | Mitigacion base completada |
| A03 | Injection | Riesgo medio; SQL via Supabase client es parametrizado, pero HTML rico y prompt injection requieren guardrails. | 34 `.rpc(`; 6 `dangerouslySetInnerHTML`; sanitizador HTML, URL sanitizer de Markdown y guardrails de prompt agregados. | 1.4, 5.3 | Mitigacion base completada |
| A04 | Insecure Design | Threat model STRIDE baseline creado; requiere firma humana. | `docs/security/threat-model.md` con registro de revision. | 5.4 | En progreso operativo |
| A05 | Security Misconfiguration | Headers base y CSP report-only configurados; enforcement esta listo por bandera y requiere soak. | `apps/web/next-config/security-headers.js`, `/api/csp-report`, `docs/security/csp-enforcement.md`. | 5.5 | En progreso operativo |
| A06 | Vulnerable and Outdated Components | CI de audit/licencias y Dependabot configurados; validacion local high/critical limpia; falta primera corrida GitHub. | `.github/workflows/security-secrets.yml`, `.github/dependabot.yml`, `dependency-policy.md`. | 5.6 | En progreso operativo |
| A07 | Identification and Auth Failures | Lockout, HIBP, password 12+ y OAuth state tests implementados; MFA aun pendiente. | `auth-policy.md`, `login/lockout.ts`, `password-breach-check.server.ts`, `oauth-callback.service.test.ts`. | 5.7 | En progreso operativo |
| A08 | Software and Data Integrity Failures | Politica RPO/RTO, SRI, signing, checksums, rollback y runbook restore definidos; falta restore drill real. | `docs/security/data-integrity-backups.md`, `docs/security/backup-restore-drill.md`. | 5.8 | En progreso operativo |
| A09 | Security Logging and Monitoring Failures | Riesgo alto heredado por `console.*` y eventos de seguridad parciales. | `recordSecurityEvent` usado para prompt injection LIA/Study Planner. | 1.6, 4.11, 5.9 | En progreso |
| A10 | SSRF | No auditado completo aqui. | `safe-fetch.ts` corresponde a 5.10, fuera de esta asignacion. | 5.10 | Pendiente |

## Decision

La matriz no declara cobertura OWASP completa. Esta pasada deja 5.4-5.8 con controles de repo listos y evidencia local, pero conserva pendientes operativos: firma del threat model, CSP enforcement despues del soak, primera corrida verde de audit/dependencias en GitHub, MFA Admin/Business, restore drill real, SSRF, upload hardening, audit log e IRP.
