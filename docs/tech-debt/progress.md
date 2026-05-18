# Progreso deuda tecnica

Ultima actualizacion: 2026-05-18.

## Fase 1 - Type Safety y Validacion

| Tarea | Estado | Evidencia | Pendiente |
|---|---|---|---|
| 1.1 Baseline TS/ESLint | Parcial / bloqueada | `docs/tech-debt/lint-baseline.txt`, `docs/tech-debt/typecheck-baseline.txt`, `docs/tech-debt/README.md`; `core`, `lib`, `shared` aislados completan rapido; cortes P3 confirman timeouts en dominios grandes de `app/api` y `features` | `type-check` oficial debe completar; `src/app/**` y `src/features/**` siguen excediendo el corte local |
| 1.2 Reduccion de `any` | En progreso | Baseline ESLint: 155 warnings `@typescript-eslint/no-explicit-any`, por debajo de la meta de fase `<200`; invite-link PATCH removio `Record<string, any>` | Completar barrido priorizado por `app/api`, `features/admin`, `features/business-panel` |
| 1.3 Flags strict de build | Bloqueada por TypeScript | `npm run lint --workspace=apps/web` pasa con warnings; `docs/tech-debt/known-issues.md` documenta blockers | Mantener `ignoreBuildErrors` sin cambio hasta que `type-check` termine; no activar `ignoreDuringBuilds` en build hasta validar `next build` completo |
| 1.4 Validacion Zod en API routes | En progreso | `withZodBody` existente; invite-link PATCH/POST y user-groups POST/PUT business/orgSlug migrados con schemas compartidos y tests | Migrar el resto de rutas POST/PUT/PATCH por dominio; quedan 207 `await request.json()` en `app/api` |
| 1.5 Auth uniforme en API routes | Completa | `with-auth.ts` + tests; `proxy/api-route-auth.ts` aplica politica central antes de handlers; `public-routes.md` inventaria 764 entradas metodo-ruta: 654 protegidas por politica central, 105 publicas y 5 internas con secreto | Migracion cosmetica de guards legacy a `withAuth` cuando se toque cada dominio |
| 1.6 Logger unico | Completa para literals | Logger consolidado sobre `SecureLogger`; codemod removio llamadas `console.*`; guardrail ESLint activo | Revisar manualmente la calidad semantica de logs migrados mecanicamente |
| 1.7 Service Role audit | Completa | `docs/tech-debt/service-role-audit.md`; `service-role-convention.test.ts`; 0 violaciones de convencion para env reads | Regenerar tipos y reducir duplicacion de helpers admin |

## Metricas Fase 1

| Metrica | Baseline plan | Snapshot actual | Meta |
|---|---:|---:|---:|
| `any` explicitos | 982 | 13 matches `: any` en `apps/web/src` | <200 fase 1 |
| ESLint | n/d | 0 errors / 3318 warnings | 0 errors |
| `type-check` | n/d | `npm run type-check --workspace=apps/web` timeout; focal user-groups TS tambien excede 90s por TD-001 | Completa con 0 errores |
| Rutas mutadoras con Zod | ~39/451 | Parcial; invite-link PATCH/POST y user-groups POST/PUT migrados; 20 `withZodBody` matches en `app/api` | 100% mutadoras |
| `console.*` en `apps/web/src` | 3070 | 0 literals | 0 |
| `SUPABASE_SERVICE_ROLE_KEY` | 50+ | 92 files inventariados / 0 convention violations | 0 sospechosos |
| Auth API central | ~49/451 rutas explicitas | 654/764 entradas metodo-ruta protegidas por `api-route-auth`; 105 publicas documentadas; 5 internas por secreto | 100% no-publicas |

## Fase 4 - Performance / 10k usuarios

| Tarea | Estado | Evidencia | Pendiente |
|---|---|---|---|
| 4.0 Capacity budget documentado | Completa | `docs/performance/capacity-budget.md`; `CAPACITY_BUDGET` expuesto en `/api/performance/metrics` | Alimentar dashboard APM final cuando se elija proveedor |
| 4.1 Connection pooling Supavisor | Completa en repo | `docs/performance/db-pool.md`; `tools/load-testing/pool-check.ts`; `20260518121000_load_test_connection_snapshot.sql`; workflow semanal ejecuta snapshot + pool-check estricto; auditoria confirma clientes Supabase request-scoped y sin Postgres directo en `apps/web/src` | Operador debe configurar secretos reales y verificar primera corrida staging |
| 4.2 Redis cache layer | Base implementada + metricas | `apps/web/src/lib/cache/index.ts`, `getCacheStats()`, `/api/performance/metrics`, migracion inicial de `my-courses` y Study Planner a `CacheAdapter`, `docs/performance/cache-strategy.md` | Provisionar Upstash Redis, medir hit rate >=70% y migrar caches legacy sincronos |
| 4.3 Indices de escala | Base implementada | `supabase/migrations/20260518120000_indexes_for_scale_phase4.sql`, `docs/performance/indexes.md` | Validar con `pg_stat_statements`, `EXPLAIN ANALYZE` y p95 top 10 < 200 ms |
| 4.4 Paginacion obligatoria | Base implementada + audit estatica | `apps/web/src/lib/api/pagination.ts`, `supabase-pagination-audit.ts`, `npm run audit:pagination`, rutas business users y transcoding jobs migradas, `docs/performance/pagination.md` | Reducir baseline de violaciones actuales y activar `CI_STRICT_TECH_DEBT=true` en CI |
| 4.5 Cola asincrona | QStash-ready + estado durable | `apps/web/src/lib/queue/index.ts`, `apps/web/src/lib/queue/job-store.server.ts`, `20260518124500_async_jobs_phase4.sql`, `users.bulk-import` encolable con worker interno, CSV en bucket privado `job-payloads`, endpoints de polling `jobs/{jobId}`, UI de importacion con polling, `docs/performance/queues.md` | Provisionar QStash/Supabase en staging y alertas operativas |
| 4.6 Streaming/payload | Base implementada + metricas | `apps/web/src/lib/api/request-size.ts`, `apps/web/src/lib/api/response-size.ts`, `withApiObservability`, middleware 413 para payloads >1 MB, `docs/performance/payload-optimization.md` | Medir p95 response size < 50 KB y confirmar gzip/brotli en Netlify |
| 4.7 Circuit breakers | Completa en repo | `apps/web/src/lib/resilience/circuit-breaker.ts`, test unitario, metricas de provider y adopcion en OpenAI/Gemini/Google/Microsoft Calendar/OAuth/Redis/QStash/media/geocoding; `docs/performance/circuit-breakers.md` | Validar degradacion en staging con proveedores reales |
| 4.8 Edge caching/ISR | Completa en repo | `revalidate` en paginas publicas, headers CDN en `netlify.toml`, `/api/news` cacheable, `public-performance-weekly.yml`, `scripts/check-public-performance.mjs`, `lighthouserc.cjs` | Configurar secretos y ejecutar primera corrida staging |
| 4.9 Rate limiting fino | Completa en repo | `apps/web/src/proxy/rate-limits.ts`, Redis REST opcional, `docs/performance/rate-limits.md`, test de burst/429 y carga sintetica | Validar multi-instancia con Redis real |
| 4.10 Load testing CI | Completa en repo | `tests/load/*.js`, `.github/workflows/load-tests-weekly.yml`, `scripts/generate-load-test-dashboard.mjs` | Primera corrida contra staging |
| 4.11 Observabilidad | Completa en repo | correlation ID, duration headers, metricas p50/p95/p99, runbooks, sink HTTP APM configurable, `/api/health`, `/api/observability/health`, monitor programado | Configurar proveedor APM/secretos por entorno |
| 4.12 Read replicas | Completa | `docs/performance/replicas-decision.md` | Activar replica solo si reads >80%, CPU DB >60% y p95 DB-bound lo justifican |

## Metricas Fase 4

| Metrica | Baseline | Fase 4 actual | Meta |
|---|---:|---:|---:|
| p95 lectura | n/d | Pendiente k6 staging | <= 500 ms |
| p95 escritura | n/d | Pendiente k6 staging | <= 800 ms |
| Throughput sostenido | n/d | Pendiente k6 staging | >= 1000 req/s |
| Cache hit rate | 0% | Pendiente proveedor CDN/Redis | >= 70% |
| Tasa 5xx | n/d | Pendiente k6 staging | <= 0.1% |
| LCP paginas publicas | n/d | Gate Lighthouse CI agregado | <= 2.5 s |
| Tests de carga semanales en CI | no | Workflow + dashboard agregados | si |

## Fase 5 - Seguridad / OWASP

| Tarea | Estado | Evidencia | Pendiente |
|---|---|---|---|
| 5.0 Matriz OWASP | Completa | `docs/security/owasp-matrix.md` | Continuar tareas 5.4-5.16 |
| 5.1 Tenant isolation | Completa base | `requireOrgAccess`, `tenant-isolation-routes.test.ts`, `business-auth.organization.service.test.ts`, `docs/security/tenant-isolation.md` | E2E con usuarios reales Org A/Org B en staging |
| 5.2 Secretos | Completa base | `.github/workflows/security-secrets.yml`, `docs/security/secrets-rotation.md` | Rotacion operativa real en proveedores y Netlify |
| 5.3 XSS / injection / prompt injection | Completa base | `sanitize-html.ts`, tests de sanitizacion/markdown/prompt injection, `docs/security/xss-audit.md` | Auditoria SQL runtime de funciones Supabase invocadas por `.rpc(` |

## Fase 2 - Calidad sostenida

| Tarea | Estado | Evidencia | Pendiente |
|---|---|---|---|
| 2.1 Eliminar `select('*')` hot paths | Completa para literals | `docs/tech-debt/select-star-audit.md`; `SELECT_COLUMNS`; 0 `.select('*')` literals | Reemplazar 7 selectors legacy `'*'` tras regenerar schema |
| 2.2 N+1 en imports/bulk | Completa para prioritarios | `business/users/import` usa lookups/inserts/asignaciones en batch; SCORM ya usa `Promise.all`; course-videos no tiene loop N+1 | Atacar N+1 secundarios listados por auditoria estatica |
| 2.3 Hex colors hardcoded | En progreso | `docs/tech-debt/hardcoded-colors.md`; ESLint guardrail activo como warning local y error con `CI_STRICT_TECH_DEBT=true` | Reducir de 503 archivos / 3010 matches a <10 archivos antes de promoverlo a error global |
| 2.4 Cobertura de tests critica | En progreso | `@vitest/coverage-v8` instalado; `test:coverage:critical` + `.github/workflows/web-critical-quality.yml`; coverage focalizado: `apps/web/src/lib/api` 100% statements/lines, `app/api/auth/refresh` 92.85%, `dashboard-destination` 77.77%; 34 tests pasan | Ejecutar coverage completo y alcanzar >=25% global / >=60% modulos criticos |
| 2.5 Auditoria RLS | En progreso | `docs/security/rls-matrix.md`; `20260518120000_reportes_problemas_rls.sql`; `rls-migrations.test.ts` bloquea tablas publicas nuevas sin `ENABLE ROW LEVEL SECURITY` | Verificacion runtime en Supabase y E2E con fixtures reales |
| 2.6 Error envelope estandar | En progreso | `apps/web/src/lib/api/errors.ts`, `with-auth.ts`, `with-validation.ts`; rutas auth criticas (`me`, `questionnaire-status`, `sessions`, `refresh`, `dashboard-destination`) migradas; 34 tests focalizados | Migrar el resto de rutas API al envelope estandar |

## Fase 3 - Productividad

| Tarea | Estado | Evidencia | Pendiente |
|---|---|---|---|
| 3.1 Consolidar librerias de charts | Completa | `docs/tech-debt/charts-audit.md`; source y package sin `@nivo/*` ni `@tremor/react`; Recharts queda como unica libreria | Validar visualmente dashboards con datos reales |
| 3.2 OpenAPI generado | Completa | `apps/web/src/lib/openapi/document.ts`, `/api/docs`, `scripts/generate-openapi.ts`, `docs/api/openapi.json` | Registrar mas rutas conforme adopten schemas Zod |
| 3.3 Observabilidad estructurada | Completa | `x-correlation-id`, `withApiObservability`, `/api/health`, logs `request_duration_ms`, metricas runtime y sink HTTP APM configurable | Adoptar wrapper en nuevas API routes como regla de mantenimiento |
| 3.4 Migraciones SQL normalizadas | Completa | `BD.sql` eliminado; `create_cascade_delete_function.sql` renombrado a `20260518120500_delete_user_cascade_function.sql`; `supabase/migrations/README.md` | Verificar que el historial remoto de Supabase no tenga una aplicacion manual divergente |

## Fase 5 - Seguridad / OWASP

| Tarea | Estado | Evidencia | Pendiente |
|---|---|---|---|
| 5.4 Threat model STRIDE | Parcial operativo | `docs/security/threat-model.md` creado con STRIDE por Auth, uploads, LIA, multi-tenant, OAuth y pagos; registro de revision agregado | Firma de 2 personas y cadencia semestral |
| 5.5 Headers + CSP | Parcial operativo | `apps/web/next-config/security-headers.js` agrega COOP/COEP/CORP/HSTS, report-only por defecto, `CSP_ENFORCEMENT=true`, `/api/csp-report` con audit log y `csp-enforcement.md` | Soak 2 semanas, securityheaders.com y activar enforcement |
| 5.6 Dependencias seguras | Parcial operativo | `.github/dependabot.yml`, `security-secrets.yml`, `dependency-policy.md`; audit local high/critical exit 0 y license check GPL/AGPL exit 0 | Primera corrida verde de GitHub y triage de PRs Dependabot/moderadas |
| 5.7 Auth hardening | Parcial operativo | Lockout 5 fallos / 15 min Redis-ready, HIBP k-anonymity, password minimo 12, endpoint admin de revocacion, pruebas OAuth state, `auth-policy.md` | MFA Admin/Business |
| 5.8 Integridad/backups | Parcial operativo | `docs/security/data-integrity-backups.md` define RPO/RTO, SRI, code signing, checksums y rollback; `backup-restore-drill.md` agrega runbook ejecutable | Confirmar Supabase PITR y ejecutar restore drill real |
| 5.9 Logging y monitoreo | Completa en repo | `security_audit_log`, writer sanitizado, `/api/admin/security/audit-log`, UI `/admin/security`, `security-alerts.ts`, job interno y Netlify `process-security-alerts` cada 5 min | Validar ruido/umbrales con eventos reales en staging |
| 5.16 GDPR/privacidad | Completa en repo | `/api/profile/export`, `/api/profile/delete-account`, `privacy_deletion_tombstones`, `deletion-processor.ts`, job interno, Netlify `process-privacy-deletions` horario, `/privacy` enlazado | Validar primera eliminacion programada en staging con cuenta fixture |

## Metricas Fase 5

| Metrica | Snapshot actual | Meta |
|---|---:|---:|
| CSP report-only | activo | enforcement tras soak |
| Lockout login | 5 fallos / 15 min | activo multi-instancia con Redis |
| Password minimo | 12 chars + complejidad + HIBP | mantener |
| Dependabot | configurado | PRs semanales triageados |
| Backups RPO/RTO | politica documentada | restore drill verificado |
| Security audit dashboard | `/admin/security` + alertas HMAC | validar en staging |
| GDPR definitive deletion | job interno + Netlify horario | validar primera corrida |
| OAuth state validation | 3 casos automatizados | mantener en callbacks Google/Microsoft |
| CSP enforcement switch | `CSP_ENFORCEMENT=true` listo | activar post-soak |
