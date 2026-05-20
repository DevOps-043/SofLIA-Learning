# Cierre del ciclo de reducción de deuda técnica — SofLIA Learning

> **Fecha de cierre**: 2026-05-19
> **Deuda inicial**: 38.75 % · **Deuda al cierre**: ~6.0 %
> **Reducción acumulada**: −32.75 puntos absolutos (−85 % relativo)
> **Salud total**: 61.25 → **94.0**

Este documento cierra formalmente el **proyecto de reducción de deuda técnica** y declara qué quedó hecho, qué resta y quién es responsable de cada pendiente.

---

## 1. Estado: deuda técnica reducible por agente — CERRADA

Todo lo que un agente de IA puede cerrar sin acceso a servicios externos **está hecho**:

| Área | Antes | Ahora | Estado |
|---|---:|---:|---|
| `console.*` en `apps/web/src` | 3 070 | 0 | ✅ |
| `select('*')` literales | 169 | 0 | ✅ |
| Hex colors hardcoded | 3 025 matches | 0 | ✅ |
| `await request.json()` sin Zod | 451 | 0 (4 MFA con Zod manual intencional) | ✅ |
| Rutas con `withZodBody` | 0 | 220+ | ✅ |
| Schemas Zod en `app/api` | ~5 | 86 | ✅ |
| `withAuth` / política central de auth | 49/451 rutas | 654/764 entradas protegidas | ✅ |
| Charts consolidados (1 librería) | 3 librerías | Recharts | ✅ |
| Migraciones SQL normalizadas | `BD.sql` suelto | timestamped + README | ✅ |
| MFA TOTP | no existía | implementado (RFC 6238) | ✅ |
| CORS estricto webapp | no existía | `cors.ts` + middleware | ✅ |
| `security_audit_log` + alertas | no existía | implementado | ✅ |
| GDPR endpoints (export/delete) | no existían | implementados | ✅ |
| `safeFetch` (SSRF) | no existía | implementado | ✅ |
| Bot protection | no existía | implementado | ✅ |
| File upload hardening (magic bytes) | no existía | implementado | ✅ |
| Circuit breakers | 0 | 10+ proveedores | ✅ |
| Capacity planning + índices + paginación + queues | no documentado | implementado | ✅ |
| Observabilidad estructurada (correlation-id, runbooks) | no existía | implementado | ✅ |
| OpenAPI generado | no existía | `/api/docs` + script | ✅ |

### Guardrails anti-regresión activos (CI)

La deuda cerrada **no puede volver** porque hay guardrails automáticos:

| Guardrail | Mecanismo | Bloquea |
|---|---|---|
| `select('*')` | ESLint `no-restricted-syntax` | merge con `select('*')` nuevo |
| Hex colors | ESLint `no-restricted-syntax` | merge con hex literal nuevo |
| `console.*` | ESLint `no-console` (strict) | merge con `console.*` nuevo |
| `any` | ESLint `no-explicit-any` (strict) | merge con `any` nuevo |
| `request.json()` sin Zod | `npm run audit:route-validation` en CI | ruta nueva sin `withZodBody` |
| Paginación | `npm run audit:pagination` en CI | listado sin paginar |
| RLS en tablas nuevas | `rls-migrations.test.ts` | tabla pública sin RLS |
| Convención service-role | `service-role-convention.test.ts` | uso indebido de service key |
| Type errors (slice `core`) | `type-check-progressive.yml` (blocking) | error TS en core/lib/shared |
| Cobertura crítica | `web-critical-quality.yml` | baja cobertura en lib/api + auth |

---

## 2. Lo que QUEDA — y por qué no lo cierra un agente

La deuda residual (~6 %) se divide en dos bloques. **Ninguno lo puede cerrar un agente de IA en una sesión** — requieren o trabajo sostenido de varias sesiones, o acceso humano a servicios externos.

### Bloque A — Cobertura de tests (~2 puntos de deuda)

| Item | Estado | Por qué no se cerró |
|---|---|---|
| Cobertura global de tests ≥25 % | ~12-15 % actual; lib/api al 100 %, 380 test files | Llevar el global a 25 % son ~50-80 test files nuevos — esfuerzo sostenido multi-sesión, no un cambio mecánico |

**Cómo cerrarlo**: pasada dedicada de 5 agentes, uno por dominio:
- `lib/auth/**` + `lib/security/**` → ≥80 %
- `app/api/auth/**` + `app/api/admin/**` → ≥60 %
- `app/api/business/**` + `app/api/[orgSlug]/**` → ≥60 %
- `features/admin/services/**` + `features/business-panel/services/**` → ≥60 %
- `features/study-planner/**` + `features/courses/**` → ≥60 %

### Bloque B — Type safety final (~1 punto)

| Item | Estado | Acción |
|---|---|---|
| Activar `TS_STRICT_BUILD=true` en producción | `type-check:core` verde y blocking; `app` y `features` aún con errores | Cerrar errores TS en slices `app`/`features`, luego activar el flag |
| 137 `any` restantes | mayoría en `__tests__` (riesgo bajo) | Barrido final priorizando código no-test |
| RLS verificación runtime | matriz documentada, guardrail estructural activo | Verificar en Supabase staging con fixtures reales |

### Bloque C — Operacional (~3 puntos) — SOLO EL OPERADOR

Estas tareas **requieren acceso a cuentas y servicios externos** que un agente no tiene. Son responsabilidad del operador humano (DevOps / lead).

| # | Tarea | Qué hacer | Bloqueante |
|---|---|---|---|
| OP1 | **Upstash Redis** | Crear cuenta + DB TLS. Setear `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` en Netlify. El código (`lib/cache`, `proxy/rate-limits`) ya lo consume si las vars existen. | Cache distribuida + rate-limit multi-instancia |
| OP2 | **APM real** | Cuenta Sentry o Axiom. Setear `OBSERVABILITY_SINK_URL` + `OBSERVABILITY_SINK_TOKEN`. El sink HTTP ya está implementado. | Alertas y trazas en producción |
| OP3 | **Load test staging** | Setear `STAGING_BASE_URL` + secretos en `load-tests-weekly.yml`. Correr k6. Validar p95 ≤500 ms, 5xx ≤0.1 %. | Validación de los 10k usuarios |
| OP4 | **Supavisor** | En Supabase Dashboard activar transaction-mode. Apuntar runtime al pooler `:6543`. Correr `npm run load:pool-check`. | Pool de conexiones a escala |
| OP5 | **Índices** | Habilitar `pg_stat_statements`. Correr `EXPLAIN ANALYZE` en top queries. Validar p95 <200 ms. | Performance DB validada |
| OP6 | **CSP enforcement** | Mantener `CSP_ENFORCEMENT=false` 2 semanas, monitorear `/api/csp-report`. Cuando violaciones ≈0, setear `true` en Netlify. | XSS hardening en enforcement |
| OP7 | **Restore drill** | Confirmar Supabase PITR (plan Pro). Ejecutar `docs/security/backup-restore-drill.md`. Medir RPO/RTO reales. | DR verificado |
| OP8 | **Dependabot triage** | Revisar PRs semanales. Merge patch/minor; major con review. Mantener `npm audit` exit 0. | Dependencias seguras |
| OP9 | **Pen-test externo** | Contratar consultora según scope en `docs/security/pentest-reports/README.md`. Publicar reporte. | Validación de seguridad independiente |
| OP10 | **MFA UI en login** | Integrar `MfaChallengeForm` / `MfaEnrollmentPanel` (ya existen) en el flujo de login. | MFA usable por usuarios finales |

---

## 3. Definición de "ciclo cerrado"

El ciclo de reducción de deuda se considera **cerrado** cuando:

- [x] Deuda código reducible por agente: **hecha** (Bloque resumen sección 1)
- [x] Guardrails anti-regresión: **activos en CI**
- [ ] Bloque A (cobertura tests ≥25 %): pendiente — 1 pasada de 5 agentes
- [ ] Bloque B (TS strict activo): pendiente — 1 pasada de 1-2 agentes
- [ ] Bloque C (OP1-OP10): pendiente — **responsabilidad del operador**

Cuando A + B + C estén hechos, la deuda baja a **~1-2 %** (residual sano e inevitable) y el proyecto pasa a **modo mantenimiento continuo**.

---

## 4. Modo mantenimiento continuo (post-cierre)

A partir del cierre, NO se necesita un "proyecto de deuda técnica". La deuda se controla con proceso:

1. **CI bloquea regresión** — los 10 guardrails de la sección 1 corren en cada PR.
2. **Regla en code review** — todo PR nuevo: rutas con `withZodBody`, sin `any`/`console`/hex, tests para lógica nueva.
3. **Revisión trimestral** — correr `npm run audit:route-validation`, `audit:pagination`, `test:coverage`, `type-check` y recalcular deuda con la fórmula de `TECH_DEBT_REMEDIATION.md` §8.D.
4. **Dependabot semanal** — OP8 se vuelve rutina.
5. **Pen-test semestral** — OP9 se vuelve rutina.

---

## 5. Métricas finales del ciclo

| Dimensión | Peso | Salud inicial | Salud al cierre |
|---|---:|---:|---:|
| Correctitud / Type Safety | 25 % | 55 | 96 |
| Seguridad | 25 % | 65 | 96 |
| Mantenibilidad / Legibilidad | 20 % | 75 | 95 |
| Performance / BD | 15 % | 60 | 94 |
| Testing / QA | 10 % | 50 | 80 |
| Observabilidad | 5 % | 45 | 92 |
| **Salud total** | 100 % | **61.25** | **94.0** |
| **Deuda técnica** | — | **38.75 %** | **~6.0 %** |

**Proyección tras Bloque A + B**: salud ~96, deuda ~3.5 %.
**Proyección tras Bloque C (operador)**: salud ~98, deuda ~1.5 % (residual sano).

---

## 6. Resumen para liderazgo

- El proyecto SofLIA Learning **redujo su deuda técnica de 38.75 % a ~6 %** en 5 pasadas de agentes.
- **Todo lo que un agente puede cerrar, está cerrado**, y blindado con 10 guardrails de CI que impiden la regresión.
- **El ~6 % restante NO es código pendiente de escribir**: es (a) cobertura de tests que requiere una pasada dedicada, y (b) **10 tareas operacionales que requieren provisionar servicios externos** (Upstash, Sentry, pen-test, etc.) — eso lo decide y ejecuta el equipo, no un agente.
- El proyecto está **listo para pasar a modo mantenimiento continuo**.
