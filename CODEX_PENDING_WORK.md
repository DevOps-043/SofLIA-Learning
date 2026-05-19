# Codex Pending Work — Cierre de deuda técnica residual

> **Estado base**: cierre de Pasada 4. Deuda **~9 %** (salud 91.2). Meta final: salud ≥95.
> **Audiencia**: Codex (u otra IA) ejecutando cambios en paralelo.
> **Fuente de verdad**: `TECH_DEBT_REMEDIATION.md`. **Patrón canónico**: `docs/tech-debt/route-migration-pattern.md`. **TD-001 resuelto**: `docs/tech-debt/td-001-resolution.md`.
> **Reglas no negociables**: las del prompt v2 (sección "Reglas absolutas" en TECH_DEBT_REMEDIATION.md §0). NO romper funcionalidad, NO bypass de hooks/flags, NO `any`/`console.*`/hex colors/`select('*')` nuevos.

---

## Cómo usar este archivo

Cada **lote** (`L#`) es asignable a un agente independiente. Los lotes del mismo color pueden correr en paralelo. Para asignar un lote, pega al agente:

```
Lee CLAUDE.md, CLAUDE.local.md, TECH_DEBT_REMEDIATION.md, prompt_maestro.md
y docs/tech-debt/route-migration-pattern.md (si tu lote es 1.4).
Ejecuta el LOTE {{L#}} de CODEX_PENDING_WORK.md.
Reporta solo el resumen final con el formato del "Output esperado" de tu lote.
```

### Pre-autorizaciones (no pidas permiso)

- `npm install --save-dev` para deps que tu lote requiera explícitamente.
- Crear/modificar archivos dentro del scope de tu lote.
- Crear migraciones SQL nuevas en `supabase/migrations/` (NUNCA editar las existentes).
- Crear archivos en `docs/`.
- Hacer commits y abrir PR contra `reafctorizacion/main`.

### Archivos compartidos (toca con cuidado, NO consultes — usa commits aislados al final)

- `apps/web/next.config.js` y `apps/web/next-config/*`
- `apps/web/middleware.ts`
- `apps/web/.eslintrc.*`
- `apps/web/tsconfig*.json`
- `apps/web/src/app/globals.css`
- `TECH_DEBT_REMEDIATION.md`
- `docs/tech-debt/progress.md`

### Prohibido absoluto

- Desactivar flags de seguridad/calidad para forzar build.
- Saltear hooks (`--no-verify`, etc.).
- Editar migraciones SQL ya aplicadas.
- Introducir `any`, `console.*`, hex colors, `select('*')`, `@ts-ignore` sin justificación documentada.
- Webhooks (el proyecto solo usa REST).

---

# 🔴 P1 — Crítico mecánico (alto impacto, paralelizable)

## L1 — Migrar Zod en `/api/admin/*` (~35 rutas)

**Tarea**: 1.4 (parcial).
**Comando para listar rutas pendientes en tu scope**:
```bash
grep -rl "await request\.json()\|await req\.json()" apps/web/src/app/api/admin
```
**Patrón a aplicar**: `docs/tech-debt/route-migration-pattern.md` §1-2.
**Referencias de rutas ya migradas**: `apps/web/src/app/api/admin/users/create/route.ts`, `apps/web/src/app/api/admin/companies/[id]/invite-links/[linkId]/route.patch.ts`.

**Para cada ruta**:
1. Crear `./schema.ts` con Zod schema + tipo.
2. Refactorizar `route.ts` a handler `(request, body, ctx) → Response` envuelto por `withZodBody(schema, handler)` o composición con `withAuth`.
3. Reemplazar `NextResponse.json({ error })` por `apiError(code, message, status)`.
4. Si la ruta es mutación admin, mantener `requireAdmin()`.

**Output esperado**:
```
## Lote L1 — Migración Zod /api/admin
- Rutas migradas: N de N (listado completo en PR)
- Schemas creados: N
- Tests agregados: N
- Conteo `await request.json()` en /api/admin: <antes> → <después>
- PR: <link>
```

**Criterios de aceptación**:
- [ ] 0 `await request.json()` en `apps/web/src/app/api/admin/**/*.ts`.
- [ ] Cada nueva ruta tiene `__tests__/schema.test.ts` con happy + 2 inválidos.
- [ ] `npm run type-check:app` no agrega errores nuevos.
- [ ] `npm run lint --workspace=apps/web` sin warnings nuevos.

---

## L2 — Migrar Zod en `/api/[orgSlug]/business/*` (~40 rutas)

Idéntico a L1 pero scope: `apps/web/src/app/api/[orgSlug]/business`.

Comando inicial:
```bash
grep -rl "await request\.json()\|await req\.json()" "apps/web/src/app/api/[orgSlug]/business"
```

**Diferencia clave**: estas rutas son multi-tenant. Componer SIEMPRE con `requireOrgAccess(userId, orgId)` de `apps/web/src/lib/auth/requireOrgAccess.ts` antes de cualquier query. Sin esto = vulnerabilidad tenant-isolation.

**Output esperado**: mismo formato que L1.

**Criterios extra**:
- [ ] Cada ruta migrada llama `requireOrgAccess` o `requireBusiness` antes de tocar la BD.
- [ ] Test E2E mínimo: user de Org A no puede acceder al recurso de Org B.

---

## L3 — Migrar Zod en `/api/business/*` (~30 rutas)

Scope: `apps/web/src/app/api/business`. Mismo patrón que L2 (multi-tenant).

```bash
grep -rl "await request\.json()\|await req\.json()" apps/web/src/app/api/business
```

---

## L4 — Migrar Zod en `/api/courses/*` (~25 rutas)

Scope: `apps/web/src/app/api/courses`. Mayoría requiere `requireUser` (no admin).

```bash
grep -rl "await request\.json()\|await req\.json()" apps/web/src/app/api/courses
```

**Atención especial**:
- `quiz/submit`, `activities/[id]/submission`, `activities/[id]/validate` — input de usuario sin sanitizar puede llegar al LLM. Combinar con `sanitizeHtml` de `lib/security/sanitize-html.ts`.

---

## L5 — Migrar Zod en `/api/study-planner/*` (~25 rutas)

Scope: `apps/web/src/app/api/study-planner`. Mayoría requiere `requireUser`.

```bash
grep -rl "await request\.json()\|await req\.json()" apps/web/src/app/api/study-planner
```

**Atención especial**:
- `dashboard/chat/*` — input que va a Gemini. Validar `prompt-injection-detector` ya existe; mantener.
- `save-plan/*`, `generate-plan/*` — payloads grandes; usar `.max(N)` en arrays.

---

## L6 — Resto (`/api/lia`, `/api/communities`, `/api/scorm`, `/api/reels`, `/api/security`, `/api/profile`, `/api/notifications`, `/api/tts`, `/api/tours`, etc.) (~50 rutas)

Scope: el resto. Para listar pendientes:

```bash
grep -rl "await request\.json()\|await req\.json()" apps/web/src/app/api \
  | grep -v "/api/admin\|/api/business\|/api/\[orgSlug\]/business\|/api/courses\|/api/study-planner"
```

**Atención especial**:
- `/api/security/csp-report` — body es JSON del navegador, NO modificar shape, solo agregar Zod.
- `/api/scorm/runtime/*` — payloads del estándar SCORM 1.2/2004, schema debe ser permisivo en strings.

---

# 🔴 P1 — Mecánico restante

## L7 — Hex colors hardcoded (3 025 matches / 502 archivos)

**Tarea**: 2.3.
**Estado actual**: ESLint guardrail solo como warning. 502 archivos sin tocar.

**Estrategia**:
1. Generar inventario:
   ```bash
   grep -rEn "#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}\b" apps/web/src --include="*.ts" --include="*.tsx" > docs/tech-debt/hardcoded-colors-snapshot.txt
   ```
2. Clasificar cada color por categoría:
   - **Tema** → reemplazar por Tailwind class (`bg-gray-900`, `text-white`, etc.).
   - **Branded** → reemplazar por `primaryColor` / `accentColor` desde `OrganizationStylesContext`.
   - **Specific (chart)** → mover a constante en `apps/web/src/features/business-panel/components/course-analytics-tab/chart-theme.ts` o similar.
   - **SVG embebido** → justificable, dejar.
3. Aplicar reemplazos por carpeta:
   - L7a: `apps/web/src/app/*` mitad
   - L7b: `apps/web/src/features/admin/*` + `features/business-panel/*`
   - L7c: `apps/web/src/features/*` resto
   - L7d: `apps/web/src/core/*` + `shared/*`
4. Al cerrar, promover regla ESLint a `error` y agregar `CI_STRICT_TECH_DEBT=true` al workflow.

**Output esperado**:
```
## Lote L7{a|b|c|d} — Hex colors
- Archivos refactorizados: N
- Matches antes: <num>, después: <num>
- Inventario en docs/tech-debt/hardcoded-colors-{slice}.md
- PR: <link>
```

**Criterios**:
- [ ] Tu slice tiene < N/4 matches al final donde N = total inicial.
- [ ] Branded colors usan context, no inline hex.
- [ ] Dark mode no se rompe (verificación visual ≥ 3 páginas).

---

# 🟠 P2 — Calidad

## L8 — Error envelope estándar en rutas restantes (Tarea 2.6)

**Patrón**: usar `apiError(code, message, status, details?)` de `apps/web/src/lib/api/errors.ts`.

**Comando para listar rutas con respuestas no-envelope**:
```bash
grep -rEn "NextResponse\.json\(\s*\{\s*error:" apps/web/src/app/api
```

**Por cada match**, reemplazar:
```ts
// ANTES
return NextResponse.json({ error: 'Mensaje' }, { status: 400 });
// DESPUÉS
return apiError('VALIDATION_ERROR', 'Mensaje', 400);
```

**Output esperado**:
```
## Lote L8 — Error envelope
- Rutas migradas: N
- Conteo NextResponse.json error: antes <num>, después <num>
- PR: <link>
```

**Criterios**:
- [ ] 100 % rutas devuelven `{ error: code, message, details? }` shape consistente.
- [ ] Tests pasan sin cambios.

---

## L9 — Cobertura global de tests ≥ 25 % (Tarea 2.4)

**Estado actual**: lib/api 100 %, auth/refresh 92.85 %, global ~7-10 %.

**Sub-lotes (paralelizables)**:

- **L9a**: cobertura de `apps/web/src/lib/auth/**` + `apps/web/src/lib/security/**` (ya hay base, llevar a ≥ 80 %).
- **L9b**: cobertura de `apps/web/src/app/api/auth/**` (todos los flujos: login, register, refresh, logout, callbacks).
- **L9c**: cobertura de `apps/web/src/app/api/business/users/**` + `app/api/business/hierarchy/**`.
- **L9d**: cobertura de `apps/web/src/features/admin/services/**` (servicios de admin).
- **L9e**: cobertura de `apps/web/src/features/business-panel/services/**`.

Para cada sub-lote:
1. Identificar archivos sin tests usando:
   ```bash
   npx vitest run --coverage --reporter=text apps/web/src/<scope>
   ```
2. Escribir tests unitarios para los caminos: happy, error, edge cases, auth fallida.
3. NO mockear Supabase a lo loco — usar test client de Supabase real cuando aplique.

**Output esperado**:
```
## Lote L9{x} — Cobertura tests {scope}
- Cobertura antes: X.XX %
- Cobertura después: Y.YY %
- Tests agregados: N (unitarios) + M (integración)
- PR: <link>
```

**Criterios**:
- [ ] Tu sub-scope alcanza ≥ 60 % statements.
- [ ] CI workflow `web-critical-quality.yml` sigue pasando.
- [ ] Nuevos tests no son flaky (3 corridas seguidas verdes).

---

## L10 — Arreglar errores TS preexistentes revelados por TD-001

**Estado**: el split del typecheck reveló errores reales en `core`/`lib`/`shared` que estaban ocultos. Pendientes (de `docs/tech-debt/td-001-resolution.md`):

| Archivo | Tipo de error |
|---|---|
| `lib/lia-context/hooks/useErrorCapture.ts` | `logger` no declarado |
| `lib/lia-context/providers/bug-report/BugReportContextProvider.ts` | `EnrichedMetadata` sin propiedades `apiCalls`, `activeModals`, `formStates` |
| `lib/lia-context/services/ContextBuilderService.ts` | Imports `ContextRequest`, `BuiltContext`, `LiaContextProvider` faltantes + implicit `any` |
| `lib/middleware/csrf-protection.tsx` | Next 15 cookies API es async (`await cookies()`) |
| `lib/scorm/adapter.ts` | `string | undefined` → `string | null` mismatch |

**Acción**:
1. Para cada archivo, leer y entender la API esperada.
2. Arreglar el tipado SIN cambiar comportamiento.
3. Correr `npm run type-check:core --workspace=apps/web` hasta 0 errores.
4. Agregar tests donde no haya cobertura.

**Output esperado**:
```
## Lote L10 — Errores TS preexistentes
- Errores antes: <num>, después: <num>
- Archivos modificados: N
- `npm run type-check:core` exit code: 0
- PR: <link>
```

**Criterios**:
- [ ] `npm run type-check:core` exit 0.
- [ ] Comportamiento runtime sin cambios (sin tests rotos).

---

## L11 — Avanzar `type-check:app` y `type-check:features`

**Acción**:
1. Correr `npm run type-check:app --workspace=apps/web` (puede tardar minutos, está bien).
2. Listar errores, dividir por dominio.
3. Arreglar errores **sin cambiar comportamiento** (preferir tipos correctos sobre `any`).
4. Cuando exit 0, cambiar en `.github/workflows/type-check-progressive.yml` el slice `app` de `required: false` a `required: true`.
5. Repetir para `features`.

**Sub-lotes**:
- L11a: errores en `app/api/**`
- L11b: errores en `app/(dashboard)/**` y `app/[orgSlug]/**`
- L11c: errores en `features/admin`
- L11d: errores en `features/business-panel`
- L11e: errores en `features/courses` + `features/study-planner` + `features/lia`

**Output esperado**:
```
## Lote L11{x} — Type errors {scope}
- Errores antes: <num>, después: <num>
- Tipos nuevos en `<archivo>.ts`: N
- PR: <link>
```

**Criterios**:
- [ ] Tu slice tiene 0 errores TS al final.
- [ ] 0 `any` nuevos introducidos.

---

# 🟡 P2 — Seguridad fina

## L12 — Integrar MFA TOTP en login flow (5.7 follow-up)

**Estado**: endpoints listos (`/api/auth/mfa/*`). Falta integrar con login.

**Acción**:
1. En `features/auth/actions/login/*` (server action), después de validar password:
   ```ts
   const mfaStatus = await getMfaStatus(user.id);
   if (mfaStatus.enabled) {
     // No issue session yet — return { requiresMfa: true, userId }
   }
   ```
2. En `features/auth/components/LoginForm/*` agregar paso de input de TOTP code.
3. Endpoint `/api/auth/mfa/verify` ya existe; usarlo y al success **entonces** issue session.
4. Agregar página `/[orgSlug]/business-panel/settings/mfa` (o equivalente admin) para enrolar:
   - Mostrar QR del `uri` devuelto por `/api/auth/mfa/setup`.
   - Mostrar recovery codes una sola vez (con copy/download CTA).
   - Capturar primer código y llamar `/api/auth/mfa/activate`.
5. Test E2E del flujo completo.

**Deps**:
- `qrcode` (npm) para renderizar QR del `uri` del lado cliente.

**Output esperado**:
```
## Lote L12 — MFA integración UI + login
- Login flow gated por MFA: sí
- Enrollment UI funcional: sí
- Recovery codes UX: ok
- Test E2E: <ruta del test>
- PR: <link>
```

---

## L13 — E2E tenant isolation (5.1 follow-up)

**Acción**:
1. En `apps/web/playwright.config.ts` o equivalente, crear suite `tests/e2e/tenant-isolation.spec.ts`.
2. Setup: dos usuarios de prueba en orgs diferentes (Org A, Org B).
3. Casos:
   - Org A no puede leer cursos de Org B (`GET /api/[orgSlug-b]/business/courses`).
   - Org A no puede modificar config de Org B (`PUT /api/[orgSlug-b]/business/settings/organization`).
   - Org A no puede ver usuarios de Org B (`GET /api/[orgSlug-b]/business/users`).
   - Org A no puede invitar a Org B (`POST /api/[orgSlug-b]/business/invite-links`).
   - Verificar 403 en cada uno + log en `security_audit_log`.
4. Agregar al workflow `web-critical-quality.yml`.

**Criterios**:
- [ ] ≥ 4 casos E2E pasan.
- [ ] Log de seguridad registra los rechazos.

---

## L14 — CORS auditoría Netlify + endpoints públicos (5.12 follow-up)

**Acción**:
1. Revisar `netlify.toml` y asegurar que no haya `Access-Control-Allow-Origin: *` global.
2. Confirmar que el helper `enforceCors` en `apps/web/middleware.ts` cubre todas las rutas API.
3. Test E2E: request desde origen NO autorizado contra `/api/auth/me` → 403.
4. Documentar variables de entorno requeridas en producción.

---

## L15 — Antimalware en uploads (5.11 follow-up)

**Estado**: `lib/upload/validation.server.ts` valida MIME + magic bytes + tamaño. Falta scan antivirus.

**Opciones**:
- VirusTotal API (free tier limitado).
- ClamAV cloud service.
- Cloudflare Stream para videos (incluye scan).

**Acción**:
1. Wrapper `lib/security/file-scanner.ts` que llame al provider elegido.
2. Aplicar en endpoints upload críticos (`/api/admin/upload/*`, `/api/scorm/upload`, `/api/[orgSlug]/business/intro-videos/upload-url`).
3. Bloqueo si el scan reporta malware; log en `security_audit_log`.

---

## L16 — Threat model: firma de revisión (5.4)

**Acción**: documento `docs/security/threat-model.md` ya existe. Agregar al final:

```markdown
## Revisión y firmas

| Fecha | Revisor | Cambios | Aprobación |
|---|---|---|---|
| 2026-XX-XX | <nombre> | Versión inicial | ✅ |
| 2026-XX-XX | <segundo nombre> | Cross-review | ✅ |
```

Confirmar con liderazgo (humano) que firma.

---

# 🟡 P3 — Operacional (REQUIERE OPERADOR humano, no agente)

> Estos lotes los hace un humano con acceso a servicios externos. Documentar aquí para tracking, no asignar a Codex.

## OP1 — Provisionar Upstash Redis (4.2 follow-up)
- Crear cuenta Upstash + DB con TLS.
- Configurar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` en Netlify.
- Conectar `lib/cache/index.ts` y `proxy/rate-limits.ts` al cliente real.
- Validar cache hit rate ≥ 70 % en staging.

## OP2 — Conectar APM real (4.11 follow-up)
- Cuenta Sentry o Axiom.
- Configurar `OBSERVABILITY_SINK_URL` y `OBSERVABILITY_SINK_TOKEN` en Netlify.
- Validar que `/api/observability/health` reporta al provider.
- Configurar alertas mínimas (p95 > presupuesto, error rate > 1 %).

## OP3 — Primera corrida k6 contra staging (4.10 follow-up)
- Configurar `STAGING_BASE_URL` + secretos de auth en `.github/workflows/load-tests-weekly.yml`.
- Correr `auth-login.js`, `course-view.js`, `lia-chat.js`, `mixed.js`.
- Publicar resultados en `docs/performance/load-test-results.md`.
- Validar SLOs: p95 ≤ 500 ms lectura, ≤ 800 ms escritura, tasa 5xx ≤ 0.1 %.

## OP4 — Activar Supavisor + `pool-check` (4.1 follow-up)
- En Supabase Dashboard, confirmar Supavisor transaction-mode activo.
- Cambiar `SUPABASE_URL` runtime al endpoint `:6543`.
- Mantener `:5432` solo para migraciones (`SUPABASE_DB_URL_DIRECT`).
- Correr `npm run load:pool-check --workspace=apps/web` contra staging.

## OP5 — Validar índices con `pg_stat_statements` (4.3 follow-up)
- Habilitar `pg_stat_statements` en Supabase.
- Correr en staging:
  ```sql
  SELECT query, calls, mean_exec_time, total_exec_time
  FROM pg_stat_statements
  ORDER BY total_exec_time DESC LIMIT 50;
  ```
- Validar que top 10 queries lentas tienen p95 < 200 ms tras los índices nuevos.

## OP6 — Soak CSP report-only → enforcement (5.5)
- Mantener `CSP_ENFORCEMENT=false` por 2 semanas.
- Monitorear violaciones en `/api/csp-report` + `security_audit_log`.
- Cuando violaciones ≈ 0, activar `CSP_ENFORCEMENT=true` en Netlify.

## OP7 — Restore drill (5.8)
- Confirmar Supabase PITR activo (requiere Pro plan).
- Ejecutar runbook `docs/security/backup-restore-drill.md`.
- Documentar resultados (RPO/RTO reales medidos).

## OP8 — Activar TS_STRICT_BUILD (1.3 follow-up)
- Cuando L10 + L11 (todos los slices TS pasen) estén verdes, configurar `TS_STRICT_BUILD=true` en Netlify producción.
- Verificar que `next build` pasa sin errores.

## OP9 — Triage Dependabot (5.6)
- Revisar PRs semanales de Dependabot.
- Merge patch/minor automáticos. Major: review humano.
- Mantener `npm audit --omit=dev` exit 0.

## OP10 — Pen-test externo (5.14)
- Contratar consultora según scope en `docs/security/pentest-reports/README.md`.
- Publicar reporte en `docs/security/pentest-reports/<fecha>/`.

---

# 📊 Lotes resumidos por agente recomendado

Si tienes 15 agentes disponibles:

| Agente | Lote(s) | Carga |
|---|---|---|
| A1 | L1 (`/api/admin` Zod) | full-time multi-PR |
| A2 | L2 (`/api/[orgSlug]/business` Zod) | full-time multi-PR |
| A3 | L3 (`/api/business` Zod) | full-time multi-PR |
| A4 | L4 (`/api/courses` Zod) | full-time multi-PR |
| A5 | L5 (`/api/study-planner` Zod) | full-time multi-PR |
| A6 | L6 (resto Zod) | full-time |
| A7 | L7a + L7b (hex colors mitad) | full-time |
| A8 | L7c + L7d (hex colors mitad) | full-time |
| A9 | L8 (error envelope masivo) | full-time |
| A10 | L9a + L9b (cobertura tests auth/security/api/auth) | full-time |
| A11 | L9c + L9d + L9e (cobertura business/admin/features) | full-time |
| A12 | L10 + L11a + L11b (errors TS preexistentes + app slice) | full-time |
| A13 | L11c + L11d + L11e (features TS slices) | full-time |
| A14 | L12 (MFA UI + login integration) | full-time |
| A15 | L13 + L14 + L15 + L16 (E2E tenant + CORS + antimalware + threat model firma) | full-time |

Si tienes menos agentes, prioriza P1 sobre P2.

---

# Métricas de cierre objetivo

| Métrica | Hoy | Tras estos lotes | Meta final |
|---|---:|---:|---:|
| Deuda técnica | ~9 % | **~3 %** | ≤ 5 % |
| Salud total | 91.2 | **~96** | ≥ 95 |
| `await request.json()` en `/api/*` | ~190 | **0** | 0 |
| Hex colors hardcoded | 3 025 / 502 archivos | **<100 / <30 archivos** | <50 / <10 archivos |
| Cobertura tests global | ~10 % | **≥ 25 %** | ≥ 25 % |
| Errores TS en slices | core: 0, app: ?, features: ? | **0 en los 3** | 0 |
| MFA enforced en Admin/Business | no | **sí** | sí |
| Tests E2E tenant isolation | 0 | **≥ 4 casos** | ≥ 4 |

---

# Output global esperado (cuando todos los lotes cierren)

Crear `docs/tech-debt/pasada-5-cierre.md` con:

1. Métricas before/after por lote.
2. PRs mergeados (≥ 30).
3. Deuda final calculada con la fórmula de `TECH_DEBT_REMEDIATION.md` §8.D.
4. Lista de pendientes operacionales (OP1–OP10) con dueño y fecha.
5. Recomendación: ¿remover `TECH_DEBT_REMEDIATION.md` del flujo y reemplazar por proceso continuo de revisión?

**Tras eso, el proyecto cierra el ciclo de "reducción de deuda" y entra en "mantenimiento de calidad".**
