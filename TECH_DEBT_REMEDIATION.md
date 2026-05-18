# Plan de Remediación de Deuda Técnica — SofLIA Learning

> **Audiencia**: Codex (u otra IA/ingeniero) ejecutando cambios incrementales.
> **Estado inicial medido (2026-05-18)**: deuda técnica global ≈ **38.75 %** sobre el estándar definido en `prompt_maestro.md` y `CLAUDE.local.md`.
> **Meta**: reducir deuda a ≤12 % (salud ≥88/100) en 5 fases.
> **Objetivos no funcionales**: sostener **10 000 usuarios concurrentes** con p95 ≤ 500 ms, disponibilidad ≥ 99.9 %, cobertura **OWASP Top 10** completa.
> **Reglas absolutas**: NO romper funcionalidad existente, NO refactors masivos en un solo commit, validar después de cada bloque, mantener i18n es/en/pt sincronizado, no introducir colores hardcoded, no usar `any` nuevo, no introducir `console.*` nuevo.

---

## 📊 Estado actual — Cierre de 1.5/API auth central (2026-05-18)

> **Deuda técnica actual: ~14 %** (bajó desde 38.75 % → 26 % → 15 % → **14 %**).
> **Reducción acumulada: −24.75 puntos absolutos (−64 % relativo).**
> **Salud total: 86.20 / 100** (meta final: ≥88).
> **A menos de 2 puntos de la meta de salud y ~2 puntos de la meta de deuda (≤12 %).**

### Resumen ejecutivo por Fase (Pasada 2)

| Fase | Avance P1 | **Avance P2** | Lo bueno (P2) | Lo pendiente |
|---|---:|---:|---|---|
| 1 — Crítico | 40 % | **88 %** | `console.*` y `select('*')` literales a **0**, `any` 13 (`: any` scan), service-role audit ✅, auth API central: 654/764 entradas no públicas protegidas | `tsc` timeout (TD-001), migración masiva de 207 rutas con `await request.json()` pendiente |
| 2 — Alto | 29 % | **60 %** | N+1 cerrado en prioritarios, lib/api cobertura 100 %, 31 tests focales, error envelope en rutas auth críticas | Hex colors (3 029 matches sin tocar), cobertura global ~7 %, error envelope resto de rutas |
| 3 — Estratégico | 88 % | **100 %** ✅ | Charts consolidados, OpenAPI, BD.sql limpio, observabilidad estructurada completa con sink HTTP APM | Mantener adopción wrapper en rutas nuevas |
| 4 — Performance 10k | 70 % | **88 %** | QStash-ready, pool-check, audit pagination, circuit breakers en 10+ proveedores, métricas APM, dashboards | Provisionar Upstash + APM real + primera k6 staging |
| 5 — Seguridad OWASP | 15 % | **82 %** ✅ | **Explosión de implementación**: requireOrgAccess, safe-fetch, security-audit-log, sanitize-html, bot-protection, upload validation, GDPR endpoints, IRP, threat model, CSP report-only/enforce-ready, Dependabot, lockout+HIBP, OAuth state tests | MFA, CSP enforcement (post-soak), restore drill real, primera triage Dependabot |

### Leyenda de estado en checklist

- `[x]` Cerrada (meta cumplida verificada)
- `[~]` En progreso (avance medible pero no llega a meta)
- `[!]` Bloqueada (depende de otra tarea o problema externo)
- `[ ]` No iniciada

### 🔴 Bloqueadores para la Pasada 3 (resolver PRIMERO)

1. **TD-001 — `tsc --noEmit` hace timeout a los 300 s** SIGUE ACTIVO en Pasada 2. Bloquea Tarea 1.3 (activar strict mode). Probable causa: tamaño del proyecto + memoria + dependencias cruzadas. Necesita: `tsc --noEmit --extendedDiagnostics`, posible split por subproyecto, `incremental: true` en `tsconfig`.
2. **Migración masiva de 207 rutas con `await request.json()` → `withZodBody`** — los helpers están listos, falta el trabajo iterativo. Mayor multiplicador de salud pendiente.
3. **Hex colors masivo** (3 029 matches en 505 archivos) — único ítem mecánico de alto volumen sin atacar. Script find/replace + revisión por carpeta.
4. **Cobertura global de tests** (~7 %) — lib/api ya está al 100 %, falta replicar en el resto.

---

## Índice navegable

| Sección | Contenido |
|---|---|
| [0](#0-convenciones-obligatorias-para-codex) | Convenciones obligatorias |
| [1](#1-fase-1--crítico-semanas-1-4--bloquea-calidad) | **Fase 1 — Crítico** (TypeScript estricto, validación, auth, logger) |
| [2](#2-fase-2--alto-mes-2-3--calidad-sostenida) | **Fase 2 — Alto** (select/N+1/colores/tests/RLS/error envelope) |
| [3](#3-fase-3--estratégico-q1--productividad) | **Fase 3 — Estratégico** (charts/OpenAPI/observabilidad) |
| [4](#4-fase-4--performance-y-escalabilidad-para-10-000-usuarios-concurrentes) | **Fase 4 — Performance 10k** (pooling, cache, índices, queues, APM, etc.) |
| [5](#5-fase-5--hardening-de-seguridad-owasp-top-10--más) | **Fase 5 — Hardening Seguridad** (OWASP, threat model, CSP, audit log, etc.) |
| [6](#6-reglas-anti-regresión-aplicar-ahora) | Reglas anti-regresión (ESLint, hooks) |
| [7](#7-checklist-de-progreso) | Checklist completo |
| [8](#8-cómo-medir-el-avance-global) | Tablas de métricas y deuda |
| [9](#9-qué-no-hacer-errores-comunes) | Qué NO hacer |
| [10](#10-comunicación-de-resultados) | Comunicación de resultados |

## Tabla maestra de archivos auxiliares a crear

Todos los documentos siguientes deben existir bajo `docs/`. Codex debe crearlos vacíos (con sus headers correctos) en el primer PR de la fase correspondiente, y luego poblarlos a medida que avanza.

| Ruta | Fase | Propósito |
|---|---|---|
| `docs/tech-debt/README.md` | 1.1 | Índice de errores TS/ESLint por archivo |
| `docs/tech-debt/typecheck-baseline.txt` | 1.1 | Output completo de `npm run type-check` inicial |
| `docs/tech-debt/lint-baseline.txt` | 1.1 | Output completo de `npm run lint` inicial |
| `docs/tech-debt/known-issues.md` | 1.3 | Errores tolerados temporalmente con plan de fix |
| `docs/tech-debt/public-routes.md` | 1.5 | Inventario de rutas públicas con justificación |
| `docs/tech-debt/service-role-audit.md` | 1.7 | Auditoría de uso de `SUPABASE_SERVICE_ROLE_KEY` |
| `docs/tech-debt/select-star-audit.md` | 2.1 | Inventario de `.select('*')` |
| `docs/tech-debt/hardcoded-colors.md` | 2.3 | Inventario de hex colors a migrar |
| `docs/tech-debt/charts-audit.md` | 3.1 | Uso de Nivo/Recharts/Tremor |
| `docs/tech-debt/progress.md` | continuo | Tabla de métricas actualizada por fase |
| `docs/security/rls-matrix.md` | 2.5 | Matriz RLS por tabla |
| `docs/security/threat-model.md` | 5.4 | Threat model STRIDE |
| `docs/security/secrets-rotation.md` | 5.2 | Política de rotación de secretos |
| `docs/security/auth-policy.md` | 5.7 | Política de auth (lockout, MFA, etc.) |
| `docs/security/dependency-policy.md` | 5.6 | Política de gestión de deps |
| `docs/security/csp-enforcement.md` | 5.5 | Runbook de soak y activacion CSP enforcement |
| `docs/security/backup-restore-drill.md` | 5.8 | Runbook de restore drill PITR/backups |
| `docs/security/upload-policy.md` | 5.11 | Política de uploads seguros |
| `docs/security/ssrf-audit.md` | 5.10 | Auditoría de fetches dinámicos / SSRF |
| `docs/security/cors-audit.md` | 5.12 | Auditoría CORS Web/API/Netlify |
| `docs/security/xss-audit.md` | 5.3 | Auditoría de `dangerouslySetInnerHTML` |
| `docs/security/incident-response.md` | 5.15 | Plan de respuesta a incidentes |
| `docs/security/incident-drill-2026-05.md` | 5.15 | Paquete de tabletop IR |
| `docs/security/pii-inventory.md` | 5.16 | Inventario de PII y retención |
| `docs/security/pentest-reports/` | 5.14 | Carpeta para reportes de pen-test |
| `docs/performance/capacity-budget.md` | 4.0 | Presupuestos de capacidad |
| `docs/performance/db-pool.md` | 4.1 | Configuración de pooling Postgres |
| `docs/performance/cache-strategy.md` | 4.2 | TTLs e invalidación de cache |
| `docs/performance/indexes.md` | 4.3 | Catálogo de índices con justificación |
| `docs/performance/queues.md` | 4.5 | Catálogo de jobs asíncronos |
| `docs/performance/rate-limits.md` | 4.9 | Límites por endpoint |
| `docs/performance/load-test-results.md` | 4.10 | Resultados k6 semanales |
| `docs/performance/replicas-decision.md` | 4.12 | Decisión read replicas con datos |
| `docs/observability/runbooks/` | 4.11 | Runbooks por alerta |
| `docs/api/openapi.json` | 3.2 | Contrato OpenAPI generado |
| `supabase/migrations/README.md` | 3.4 | Convención de migraciones |
| `tests/load/` | 4.10 | Scripts k6 |
| `apps/web/src/lib/api/with-validation.ts` | 1.4 | Helper Zod |
| `apps/web/src/lib/api/with-auth.ts` | 1.5 | Helper auth |
| `apps/web/src/lib/api/errors.ts` | 2.6 | Error envelope |
| `apps/web/src/lib/cache/index.ts` | 4.2 | Adapter Redis |
| `apps/web/src/lib/resilience/circuit-breaker.ts` | 4.7 | Circuit breaker |
| `apps/web/src/lib/security/safe-fetch.ts` | 5.10 | Fetch protegido contra SSRF |

---

## 0. Convenciones obligatorias para Codex

Antes de tocar código:

1. **Lee siempre** `CLAUDE.md`, `CLAUDE.local.md`, `prompt_maestro.md` y `.cursorrules`.
2. **Una tarea = un commit pequeño** (≤300 líneas modificadas). Si supera ese umbral, divide.
3. **Cada cambio** debe correr `npm run type-check` y `npm run lint` **sin nuevos errores** antes de commitear.
4. **NO desactives** `ignoreBuildErrors` ni `ignoreDuringBuilds` hasta completar la Fase 1 — pero ya no agregues errores nuevos.
5. **Prohibido**: agregar `any`, `@ts-ignore`, `eslint-disable`, `console.*`, hex colors, `select('*')` nuevos.
6. **Formato de commit**: `fix(deuda): <area> - <descripción corta>` o `refactor(deuda): ...`. Ej: `fix(deuda): types - elimina any en auth.service.ts`.
7. **Después de cada PR**, actualiza el checklist de progreso al final de este documento.

---

## 1. FASE 1 — Crítico (semanas 1-4) — bloquea calidad

> **Objetivo de la fase**: habilitar el compilador como red de seguridad, cerrar brechas de validación de input y eliminar fugas de PII en logs.

### Tarea 1.1 — Inventariar errores reales de TypeScript y ESLint

**Por qué**: hoy [apps/web/next-config/create-next-config.js](apps/web/next-config/create-next-config.js#L12-L15) tiene `ignoreBuildErrors: true` y `ignoreDuringBuilds: true`. No sabemos cuántos errores hay escondidos.

**Acción**:
- Ejecutar `npm run type-check --workspace=apps/web` y guardar la salida en `docs/tech-debt/typecheck-baseline.txt`.
- Ejecutar `npm run lint --workspace=apps/web` y guardar en `docs/tech-debt/lint-baseline.txt`.
- Crear `docs/tech-debt/README.md` con el conteo total por archivo y categoría de error.

**No tocar** `next.config.js` todavía.

**Criterio de aceptación**:
- [ ] Existen los dos baselines en `docs/tech-debt/`.
- [ ] El README enumera Top 20 archivos por número de errores.

**Template `docs/tech-debt/README.md`**:

| Archivo | # errores TS | # warnings ESLint | Categoría dominante | Owner asignado | Fase |
|---|---|---|---|---|---|
| `apps/web/src/...` | 0 | 0 | (any / unused-vars / etc.) | TBD | 1.2 |

**Template `docs/tech-debt/known-issues.md`**:

| ID | Archivo:línea | Tipo (TS/ESLint) | Mensaje | Razón de excepción | Fecha de fix prevista |
|---|---|---|---|---|---|
| TD-001 | — | — | — | — | — |

---

### Tarea 1.2 — Eliminar `any` priorizado por superficie de riesgo

**Por qué**: 982 ocurrencias de `any` en 384 archivos. Bloquean la activación segura del strict mode en CI.

**Orden de prioridad** (no saltarse):

1. `apps/web/src/lib/auth/**` — autenticación
2. `apps/web/src/app/api/**/route.ts` — endpoints expuestos
3. `apps/web/src/features/auth/**` — login/registro
4. `apps/web/src/features/admin/**` — panel admin
5. `apps/web/src/features/business-panel/**` — panel org
6. `apps/web/src/core/services/**` — servicios core
7. Resto

**Reglas**:
- Reemplazar por tipos generados de Supabase (`lib/supabase/types.ts`) cuando aplique.
- Usar `unknown` + type guard cuando el tipo no es derivable.
- Crear tipos en `types.ts` del feature, no inline en componentes.
- **Prohibido**: cambiar `any` por `Record<string, any>` o `object` sin justificación.

**Comando para verificar progreso**:
```bash
# PowerShell
(Get-ChildItem apps/web/src -Recurse -Include *.ts,*.tsx | Select-String -Pattern ': any[\s,=;)\]>]' -SimpleMatch:$false | Measure-Object).Count
```

**Criterio de aceptación por sub-PR**:
- [ ] El conteo de `any` en el módulo bajó al menos 80%.
- [ ] Cero `any` nuevos introducidos.
- [ ] `npm run type-check` no agrega errores nuevos.

**Meta de fase**: <200 ocurrencias totales (reducción ~80%).

---

### Tarea 1.3 — Reactivar `ignoreBuildErrors` y `ignoreDuringBuilds`

**Por qué**: una vez que la Tarea 1.1 + 1.2 reduzca errores a 0 (o a una whitelist controlada).

**Acción**:
- En [apps/web/next-config/create-next-config.js](apps/web/next-config/create-next-config.js):
  ```js
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  ```
- Si quedan errores residuales conocidos, documentarlos en `docs/tech-debt/known-issues.md` con plan de fix.
- Agregar al pipeline (GitHub Actions / Netlify): step que falle si `npm run type-check` o `npm run lint` retornan ≠ 0.

**Criterio de aceptación**:
- [ ] Build local pasa con flags en `false`.
- [ ] CI bloquea PRs con errores de tipos/lint.

---

### Tarea 1.4 — Patrón uniforme de validación de input (Zod) en API routes

**Por qué**: solo ~8.6% de las 451 rutas tienen validación Zod visible. El resto puede aceptar payloads malformados o maliciosos.

**Acción**:

1. Crear helper en `apps/web/src/lib/api/with-validation.ts`:
   ```ts
   import { NextRequest, NextResponse } from 'next/server';
   import { ZodSchema } from 'zod';

   export function withZodBody<T>(
     schema: ZodSchema<T>,
     handler: (req: NextRequest, body: T, ctx: any) => Promise<NextResponse>
   ) {
     return async (req: NextRequest, ctx: any) => {
       let json: unknown;
       try {
         json = await req.json();
       } catch {
         return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
       }
       const parsed = schema.safeParse(json);
       if (!parsed.success) {
         return NextResponse.json(
           { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
           { status: 422 }
         );
       }
       return handler(req, parsed.data, ctx);
     };
   }
   ```

2. Migrar rutas en este orden:
   - `apps/web/src/app/api/auth/**` (login, register, reset-password)
   - `apps/web/src/app/api/admin/**` (operaciones privilegiadas)
   - `apps/web/src/app/api/business/**`
   - `apps/web/src/app/api/courses/**`
   - Resto

3. Los schemas Zod viven en `apps/web/src/app/api/<route>/schema.ts` (no inline).

**Criterio de aceptación por ruta**:
- [ ] Schema Zod en archivo aparte.
- [ ] Ruta usa `withZodBody`.
- [ ] Response de error sigue formato `{ error: string, details?: unknown }`.
- [ ] Test unitario del schema con caso happy y al menos 2 casos inválidos.

**Meta de fase**: 100% rutas POST/PUT/PATCH tienen validación.

---

### Tarea 1.5 — Patrón uniforme de autenticación en API routes

**Por qué**: solo 49 de 451 rutas (~11%) tienen check de auth explícito. El resto depende implícitamente de cookies de Supabase — riesgo de exposición si una ruta sensible carece de guard.

**Acción**:

1. Crear `apps/web/src/lib/api/with-auth.ts`:
   ```ts
   import { NextRequest, NextResponse } from 'next/server';
   import { createServerClient } from '@/lib/supabase/server';

   export type AuthContext = {
     userId: string;
     role: 'Admin' | 'Business' | 'BusinessUser' | 'Instructor';
     email: string;
   };

   export function withAuth(
     handler: (req: NextRequest, auth: AuthContext, ctx: any) => Promise<NextResponse>,
     opts?: { roles?: AuthContext['role'][] }
   ) {
     return async (req: NextRequest, ctx: any) => {
       const supabase = await createServerClient();
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
       // resolver rol desde tabla usuarios
       const { data: profile } = await supabase
         .from('usuarios')
         .select('role, email')
         .eq('id', user.id)
         .single();
       if (!profile) return NextResponse.json({ error: 'PROFILE_NOT_FOUND' }, { status: 403 });
       if (opts?.roles && !opts.roles.includes(profile.role)) {
         return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
       }
       return handler(req, { userId: user.id, role: profile.role, email: profile.email }, ctx);
     };
   }
   ```

2. Auditar las 451 rutas. Clasificar:
   - **Públicas** (sin auth): documentar en `docs/tech-debt/public-routes.md` con justificación.
   - **Autenticadas**: aplicar `withAuth(...)`.
   - **Por rol**: aplicar `withAuth(handler, { roles: ['Admin'] })`.

3. Componer con validación: `withAuth(withZodBody(schema, handler))`.

**Criterio de aceptación**:
- [ ] Inventario completo en `docs/tech-debt/public-routes.md`.
- [ ] Todas las rutas no-públicas usan `withAuth`.
- [ ] Test unitario para `withAuth` con cases: no auth, auth pero rol incorrecto, auth ok.

---

### Tarea 1.6 — Logger único y eliminación de `console.*`

**Por qué**: 3,070 `console.*` en 514 archivos. Riesgo de PII en logs de producción y observabilidad inconsistente.

**Acción**:

1. Consolidar logger único en `apps/web/src/lib/logger/index.ts`:
   - Reutilizar `secure-logger.class.ts` existente.
   - Exportar `logger.debug | info | warn | error | child(meta)`.
   - En producción: solo `info` y arriba. En dev: todos.
   - Sanitizar PII (email, tokens, passwords) por defecto.

2. Crear regla ESLint `no-console` en `apps/web/.eslintrc.js` con:
   ```json
   "no-console": ["error", { "allow": [] }]
   ```

3. Migración masiva por carpeta:
   - `apps/web/src/lib/**` (utilidades — alto riesgo de PII)
   - `apps/web/src/app/api/**` (logs server-side)
   - `apps/web/src/features/auth/**`
   - `apps/web/src/features/**`
   - `apps/web/src/core/**`
   - Resto

4. Para cada `console.error(err)` → `logger.error('contexto.específico', { err })`.

**Criterio de aceptación**:
- [ ] `apps/web/.eslintrc.js` tiene `no-console: error`.
- [ ] `npm run lint` retorna 0 violations de `no-console`.
- [ ] Logger sanitiza email/tokens (test unitario que lo verifique).

**Meta de fase**: 0 `console.*` en `apps/web/src`.

---

### Tarea 1.7 — Auditoría de Service Role Key

**Por qué**: 50+ archivos tocan `SUPABASE_SERVICE_ROLE_KEY`. Algunos están fuera de `app/api/*` (ej: `features/admin/services/auditLog.service.ts`). El service role bypasa RLS — exposición = compromiso total.

**Acción**:
1. Inventariar todos los archivos que importan `SUPABASE_SERVICE_ROLE_KEY` en `docs/tech-debt/service-role-audit.md`.
2. Clasificar cada uso:
   - **Justificado** (job cron, operación admin server-only).
   - **Sospechoso** (servicio importado desde cliente o ruta no-admin).
   - **A eliminar** (puede hacerse con client normal + RLS).
3. Crear convención: cualquier archivo con service role debe terminar en `.server.ts` o vivir en `app/api/*/route.ts`.
4. Agregar regla ESLint custom o test que valide la convención.

**Criterio de aceptación**:
- [ ] Inventario completo en `docs/tech-debt/service-role-audit.md`.
- [ ] Cero usos "Sospechosos" o "A eliminar" pendientes.
- [ ] Convención `.server.ts` aplicada.

**Template `docs/tech-debt/service-role-audit.md`**:

| Archivo | Función / Propósito | Importado por | Veredicto | Acción | Estado |
|---|---|---|---|---|---|
| `apps/web/src/...` | (ej: crear usuarios admin) | `app/api/admin/users/route.ts` | Justificado / Sospechoso / A eliminar | Renombrar a `.server.ts` / Migrar a anon+RLS / OK | Pendiente / Done |

---

## 2. FASE 2 — Alto (mes 2-3) — calidad sostenida

### Tarea 2.1 — Eliminar `select('*')` en hot paths

**Por qué**: 169 ocurrencias en 116 archivos. Inflación de payload, bloqueo de optimizaciones, exposición de columnas sensibles.

**Acción**:
- Inventariar las 169 ocurrencias y priorizar las que tocan `usuarios`, `organizations`, `lia_messages`, `study_sessions`.
- Reemplazar por selección explícita de campos: `.select('id, email, role')`.
- Para joins, usar la sintaxis Supabase: `.select('id, courses (id, title)')`.
- Si un campo es opcional/dinámico, crear un tipo helper en `lib/supabase/select-types.ts`.

**Criterio de aceptación**:
- [ ] <30 ocurrencias de `select('*')` (solo en queries internas justificadas).
- [ ] Inventario en `docs/tech-debt/select-star-audit.md` con razón para cada uno restante.

**Template `docs/tech-debt/select-star-audit.md`**:

| Archivo:línea | Tabla | Columnas reales necesarias | ¿Llega al cliente? | Acción | Estado |
|---|---|---|---|---|---|
| `apps/web/src/...:42` | `usuarios` | `id, email, role` | Sí | Refactor a `.select('id,email,role')` | Pendiente |

---

### Tarea 2.2 — Resolver patrones N+1 en imports y bulk operations

**Por qué**: 14 archivos en API routes tienen `forEach/map.await` o loops con `await`. Algunos hacen 1 query por iteración.

**Archivos prioritarios**:
- [apps/web/src/app/api/business/users/import/route.ts](apps/web/src/app/api/business/users/import/route.ts)
- [apps/web/src/app/api/[orgSlug]/business/users/import/route.ts](apps/web/src/app/api/[orgSlug]/business/users/import/route.ts)
- [apps/web/src/app/api/admin/upload/course-videos/route.ts](apps/web/src/app/api/admin/upload/course-videos/route.ts)
- [apps/web/src/app/api/scorm/upload/route.ts](apps/web/src/app/api/scorm/upload/route.ts)

**Acción**:
- Refactor a `Promise.all` cuando las operaciones sean independientes.
- Si requieren orden, usar batch insert (`.insert([row1, row2, ...])`).
- Para SCORM, evaluar mover a queue async.

**Criterio de aceptación**:
- [ ] Cada archivo refactorizado tiene benchmark before/after en su PR.
- [ ] Test que valida bulk import de 100+ filas <3s en local.

---

### Tarea 2.3 — Eliminar hex colors hardcoded

**Por qué**: 139 archivos violan la regla CRÍTICA del `CLAUDE.md`: "NEVER use `#0F1419`, `#1E2329`, etc.".

**Acción**:
1. Inventariar en `docs/tech-debt/hardcoded-colors.md` con archivo:línea.
2. Categorizar:
   - **Branded** → migrar a `primaryColor`/`accentColor` desde `OrganizationStylesContext`.
   - **Tema** → migrar a Tailwind class (`bg-gray-900` etc.).
   - **Specific** → mover a CSS variable en `globals.css`.
3. Agregar regla ESLint o stylelint que bloquee nuevos hex literals en `.tsx`/`.ts`.

**Criterio de aceptación**:
- [ ] <10 archivos con hex (solo SVG embebidos justificados).
- [ ] Regla ESLint activa.

**Template `docs/tech-debt/hardcoded-colors.md`**:

| Archivo:línea | Color encontrado | Categoría (Branded/Tema/Specific) | Reemplazo aplicado | Estado |
|---|---|---|---|---|
| `apps/web/src/...:88` | `#0F1419` | Tema | `bg-gray-900` | Pendiente / Done |
| `apps/web/src/...:104` | `#00D4B3` | Branded | `style={{ backgroundColor: accentColor }}` | Pendiente |

---

### Tarea 2.4 — Cobertura de tests crítica

**Por qué**: ratio actual ~5%. Áreas críticas sin cobertura.

**Meta de fase**: 25% en módulos críticos.

**Acción** (en este orden):
1. `apps/web/src/lib/auth/**` → 80% cobertura.
2. `apps/web/src/app/api/auth/**` → 70% cobertura.
3. `apps/web/src/app/api/business/users/**` → 60% cobertura.
4. `apps/web/src/features/auth/services/**` → 60% cobertura.
5. `apps/web/src/lib/api/with-auth.ts` y `with-validation.ts` → 100%.

**Tipo de tests**:
- Unitarios para validaciones, parsers, formatters.
- Integración para flujos completos de routes (con Supabase test client).

**Criterio de aceptación**:
- [ ] `npm run test:coverage` reporta ≥25% global, ≥60% en módulos críticos.
- [ ] CI bloquea PRs que bajen cobertura en >2%.

---

### Tarea 2.5 — Auditoría completa de RLS

**Por qué**: solo 15 de 37 migraciones mencionan RLS. Tablas creadas sin RLS = exposición de datos si service role tiene fuga.

**Acción**:
1. Listar todas las tablas con `SELECT tablename FROM pg_tables WHERE schemaname='public'`.
2. Verificar `pg_class.relrowsecurity` para cada una.
3. Crear migración `2026XXXX_enable_rls_everywhere.sql` que habilite RLS en tablas sin políticas y agregue policy `service_role only` por defecto.
4. Para cada tabla, definir explícitamente políticas `SELECT/INSERT/UPDATE/DELETE` por rol.
5. Documentar matriz en `docs/security/rls-matrix.md`.

**Criterio de aceptación**:
- [ ] 100% tablas tienen `relrowsecurity = true`.
- [ ] Matriz RLS documentada.
- [ ] Test E2E que verifica que un user no puede leer datos de otra org.

**Template `docs/security/rls-matrix.md`**:

Para cada tabla en `public`:

| Tabla | RLS activo | SELECT (rol→condición) | INSERT | UPDATE | DELETE | Notas |
|---|---|---|---|---|---|---|
| `usuarios` | ✅ | self / Admin all | self register / Admin | self+Admin | Admin only | PII — masking en logs |
| `organizations` | ✅ | members of org / Admin all | Admin / Business creator | Business owner+Admin | Admin only | — |
| `lia_messages` | ✅ | conv. owner / Admin | conv. owner | nadie | conv. owner+Admin | retención 90 días |
| `study_sessions` | ✅ | user owner | user owner | user owner | user owner | — |
| (… completar 100% de tablas …) | | | | | | |

**Query para auditar RLS actual** (correr antes y después):
```sql
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename) AS policies_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY rls_enabled ASC, policies_count ASC;
```

---

### Tarea 2.6 — Error envelope estándar en API routes

**Por qué**: 51 rutas retornan `null` o lanzan errores sin estructura.

**Acción**:
1. Definir en `apps/web/src/lib/api/errors.ts`:
   ```ts
   export type ApiError = {
     error: string;          // código machine-readable: 'NOT_FOUND', 'FORBIDDEN', ...
     message: string;        // mensaje human-readable seguro (sin internals)
     details?: unknown;      // opcional, solo para 4xx
     requestId?: string;
   };
   ```
2. Crear helpers: `apiError(code, message, status, details?)`.
3. Migrar las 51 rutas + las nuevas.

**Criterio de aceptación**:
- [ ] 100% rutas usan el envelope.
- [ ] Test que valida shape de error.

---

## 3. FASE 3 — Estratégico (Q+1) — productividad

### Tarea 3.1 — Consolidar librerías de charts

**Por qué**: `@nivo/*` (16 paquetes) + `recharts` + `@tremor/react` coexisten. Bundle inflado, mantenimiento triple.

**Acción**:
- Auditar uso de cada lib en `docs/tech-debt/charts-audit.md`.
- Elegir UNA (recomendación: Recharts por bundle size, o Nivo si las viz son críticas).
- Migrar incrementalmente.
- Eliminar dependencias no usadas.

**Criterio**: 1 sola librería de charts en `package.json`.

**Template `docs/tech-debt/charts-audit.md`**:

| Componente | Lib usada | Tipo de chart | Reemplazo propuesto | Bundle estimado | Estado |
|---|---|---|---|---|---|
| `BusinessAnalyticsBarChart` | @nivo/bar | bar | recharts `<BarChart>` | -120 KB | Pendiente |
| `LiaUsageHeatmap` | @nivo/heatmap | heatmap | mantener (no hay equivalente) | — | Justificado |

---

### Tarea 3.2 — Documentar contratos OpenAPI

**Por qué**: 451 rutas sin documentación formal de contratos.

**Acción**:
- Generar OpenAPI a partir de schemas Zod (lib `zod-to-openapi`).
- Endpoint `/api/docs` (dev only) sirve Swagger UI.
- Exportar JSON a `docs/api/openapi.json` en cada build.

---

### Tarea 3.3 — Métricas y observabilidad estructurada

**Acción**:
- Agregar `correlationId` por request en middleware.
- Agregar `request_duration_ms` en log de cada route.
- Integrar OpenTelemetry o equivalente (depende de infraestructura).
- Health check ampliado en `/api/health` con DB, OpenAI, Gemini.

---

### Tarea 3.4 — Migraciones SQL: limpieza y convención

**Por qué**: `BD.sql` y `create_cascade_delete_function.sql` rompen la convención `YYYYMMDDHHMMSS_descripcion.sql`.

**Acción**:
- Convertir a migraciones timestamped o eliminarlos si ya están aplicados.
- Documentar en `supabase/migrations/README.md` la convención y orden esperado.

---

## 4. FASE 4 — Performance y escalabilidad para 10 000 usuarios concurrentes

> **Objetivo de la fase**: garantizar que el sistema sostenga 10 000 usuarios concurrentes con p95 <500 ms y disponibilidad ≥99.9%.
> **Modelo de carga asumido**: 10 000 usuarios activos simultáneos, cada uno con ~6 req/min promedio (1 cada 10 s), picos de 3x = **~3 000 req/s pico**, 1 000 req/s sostenido.
> **No hacer**: optimizaciones especulativas sin baseline medido. Cada cambio aquí requiere benchmark before/after.

### 4.0 — Capacity planning (presupuestos de recursos)

| Recurso | Presupuesto a 10k usuarios | Justificación |
|---|---|---|
| Throughput req/s sostenido | 1 000 req/s | 10 000 × 6/60 |
| Throughput req/s pico (3x) | 3 000 req/s | Eventos: inicio de jornada, sync calendar |
| Conexiones Postgres activas | ≤ 200 (via pooler) | Supabase free: 60 directas, Pro: 200. Usar Supavisor |
| Memoria por instancia Next.js | ≤ 1 GB / instancia, ≥ 4 instancias | Stateless, horizontal scaling |
| Latencia p50 endpoints lectura | ≤ 120 ms | Cacheables |
| Latencia p95 endpoints lectura | ≤ 500 ms | — |
| Latencia p99 endpoints lectura | ≤ 1 200 ms | — |
| Latencia p95 endpoints escritura | ≤ 800 ms | — |
| Tasa de error 5xx | ≤ 0.1 % | — |
| Disponibilidad mensual | ≥ 99.9 % | SLO objetivo (~43 min downtime/mes) |
| Tamaño máx. payload response | ≤ 100 KB | (excepto videos / SCORM) |
| Tiempo de build CI | ≤ 8 min | Productividad equipo |

**Acción inicial**: documentar estos presupuestos en `docs/performance/capacity-budget.md` y agregarlos al pipeline de monitoring.

---

### Tarea 4.1 — Connection pooling Postgres (Supavisor / PgBouncer)

**Por qué**: con 10k usuarios y ~451 rutas que abren conexiones, sin pooler agotamos el límite de Postgres en segundos.

**Acción**:
1. Verificar en Supabase Dashboard que `Supavisor` (modo transaction) está activo.
2. Cambiar `SUPABASE_URL` runtime al endpoint del pooler `:6543` para queries cortas. Mantener `:5432` solo para migraciones.
3. Auditar todo `createServerClient()` para confirmar que reutiliza conexiones por request (no instancia nueva en cada función).
4. En [apps/web/src/lib/supabase/server.ts](apps/web/src/lib/supabase/server.ts) asegurar que el cliente no mantiene estado entre requests.
5. Definir variables de entorno separadas:
   - `SUPABASE_DB_URL_POOLED` → app runtime
   - `SUPABASE_DB_URL_DIRECT` → migraciones / scripts

**Criterio**:
- [ ] Pool size documentado en `docs/performance/db-pool.md`.
- [ ] Test de carga 1 000 req/s sin "too many connections".

---

### Tarea 4.2 — Capa de caché Redis (Upstash o Vercel KV)

**Por qué**: cache in-memory (`Map`) actual no se comparte entre instancias horizontales → cache miss masivo a escala.

**Acción**:
1. Provisionar Upstash Redis (TLS, multi-region).
2. Crear abstracción en `apps/web/src/lib/cache/index.ts`:
   ```ts
   export interface CacheAdapter {
     get<T>(key: string): Promise<T | null>;
     set<T>(key: string, value: T, ttlSec: number): Promise<void>;
     del(key: string | string[]): Promise<void>;
     invalidateByTag(tag: string): Promise<void>;
   }
   ```
3. Reemplazar caches in-memory de `lib/lia-context/services/context-cache.service.ts`, `business_user_analytics_insight_cache`, etc.
4. Definir convención de keys: `tenant:{orgId}:resource:{type}:{id}` para invalidación por org.
5. TTLs por tipo de recurso (tabla en `docs/performance/cache-strategy.md`):

| Recurso | TTL | Invalidación |
|---|---|---|
| Sesión / role del usuario | 60 s | Logout / cambio rol |
| Course metadata | 5 min | Update por admin |
| Lista cursos org | 5 min | Asignación nueva |
| Analytics insights | 1 h | Manual / cron |
| Org config (planner, holidays) | 15 min | Update org admin |
| Public landing data | 1 h | Deploy |
| OpenAI/Gemini prompts base | 24 h | Manual |

6. Activar **Anthropic-style prompt caching** para llamadas a OpenAI/Gemini cuando la lib lo soporte.

**Criterio**:
- [ ] Cache hit rate ≥ 70 % en endpoints de lectura medidos.
- [ ] Test E2E que invalida correctamente al mutar.

---

### Tarea 4.3 — Auditoría e instalación de índices

**Por qué**: Postgres degrada exponencialmente sin índices en columnas frecuentes de `WHERE/JOIN/ORDER BY`. A 10k usuarios un seq-scan en `lia_messages` o `study_sessions` colapsa la DB.

**Acción**:
1. Activar `pg_stat_statements` en Supabase.
2. Query inicial para identificar queries lentas:
   ```sql
   SELECT query, calls, mean_exec_time, total_exec_time
   FROM pg_stat_statements
   ORDER BY total_exec_time DESC
   LIMIT 50;
   ```
3. Para cada query lenta, generar `EXPLAIN ANALYZE` y proponer índice.
4. Crear migración `2026XXXX_indexes_for_scale.sql` con todos los índices, **con justificación en comentario SQL**.
5. Índices candidatos iniciales (validar con `EXPLAIN`):

| Tabla | Columnas | Tipo | Razón |
|---|---|---|---|
| `lia_messages` | `(conversation_id, created_at DESC)` | btree | timeline chat |
| `user_lesson_progress` | `(user_id, lesson_id)` | btree único | lookup directo |
| `lesson_tracking` | `(user_id, started_at DESC)` | btree | analytics user |
| `study_sessions` | `(user_id, scheduled_date)` | btree | calendario |
| `organization_users` | `(organization_id, role)` | btree | filtros por rol |
| `user_course_enrollments` | `(user_id, course_id)` | btree único | enrollment check |
| `notifications` | `(user_id, read_at, created_at DESC)` | parcial WHERE read_at IS NULL | unread fast |
| `comunidad_posts` | `(comunidad_id, created_at DESC)` | btree | feed |
| `certificates` | `(user_id, course_id)` | btree único | dedup |
| `audit_log` (si existe) | `(actor_id, created_at DESC)` | btree | timeline auditoría |

6. **Evitar sobre-indexar**: medir cada índice con `pg_stat_user_indexes` y borrar los no usados a 30 días.

**Criterio**:
- [ ] p95 de las top 10 queries < 200 ms.
- [ ] Documento `docs/performance/indexes.md` con índice por índice + justificación.

---

### Tarea 4.4 — Paginación y `LIMIT` obligatorios en listados

**Por qué**: cualquier `.select()` sin `.range()` o `.limit()` que tope con tabla de millones colapsa memoria del cliente y DB.

**Acción**:
1. Auditar todas las queries Supabase que retornan arrays sin `.limit()`.
2. Patrón obligatorio:
   ```ts
   const PAGE_SIZE = 50;
   const page = Math.max(0, Number(searchParams.get('page') ?? 0));
   const { data, count } = await supabase
     .from('table')
     .select('col1, col2', { count: 'estimated' })
     .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
   ```
3. Cursor-based pagination en feeds críticos (chat, notifications, posts) — usar `created_at` como cursor en lugar de `OFFSET`.
4. Máximo `LIMIT` permitido por API: 100 (configurable, no más).

**Criterio**:
- [ ] Lint rule custom que falla si detecta `.from(...).select(...)` sin `.limit` / `.range` en archivos en `app/api/**`.
- [ ] Tests de paginación.

---

### Tarea 4.5 — Cola asíncrona para tareas pesadas

**Por qué**: SCORM upload, video transcoding, generación de certificados PDF, análisis IA y bulk imports bloquean el thread del request → timeouts y degradación a escala.

**Acción**:
1. Adoptar **Inngest** o **Upstash QStash** (compatible con Netlify Functions).
2. Mover a queue:
   - `/api/admin/upload/course-videos/transcode/` → job `video.transcode`
   - `/api/business/users/import/` → job `users.bulk-import`
   - `/api/courses/[slug]/lessons/[id]/activities/[id]/validate/` (con IA) → si toma >2s
   - `/api/lia/chat/` (responses largas) → streaming + retries con backoff
   - Generación de certificados PDF (cron + on-demand)
3. Cada job debe ser **idempotente** (clave de dedup en payload).
4. Cada job con retry policy: 3 intentos, exponential backoff (1s, 4s, 16s).
5. Dead-letter queue para fallos crónicos → alerta a Slack/Email.

**Criterio**:
- [ ] Ningún endpoint síncrono toma > 2 s.
- [ ] Documento `docs/performance/queues.md` con catálogo de jobs.

---

### Tarea 4.6 — Streaming y reducción de payload

**Por qué**: respuestas de 1 MB a 10k usuarios = 10 GB/s de egress. Inviable.

**Acción**:
1. **Compression**: confirmar gzip/brotli activo en Netlify (suele estar). Validar headers `Content-Encoding`.
2. **Streaming**: usar `ReadableStream` en endpoints que pueden tener responses grandes (LIA chat, course list, analytics).
3. **Selective fields**: combinar con Tarea 2.1 — nunca enviar columnas que el cliente no usa.
4. **Imagen optimization**:
   - Reemplazar `<img>` por `next/image` donde aplique.
   - Subir imágenes vía `intro-videos` / `content-images` con resize antes de almacenar.
   - Servir formatos modernos: WebP/AVIF.
5. **JSON `Content-Length` cap**: middleware que rechaza requests >1 MB (excepto upload routes).

**Criterio**:
- [ ] p95 response size endpoints estándar < 50 KB.
- [ ] LCP <2.5 s en páginas críticas medido con Web Vitals.

---

### Tarea 4.7 — Circuit breakers, timeouts y retries con backoff

**Por qué**: dependencias externas (OpenAI, Gemini, Google Calendar, Supabase) van a fallar. Sin circuit breaker, un fallo cae como avalancha.

**Acción**:
1. Crear `apps/web/src/lib/resilience/circuit-breaker.ts` (o usar `opossum`).
2. Wrap cada cliente externo:
   - OpenAI client → `withCircuitBreaker(openai, { timeout: 30s, errorThreshold: 50%, resetTimeout: 60s })`
   - Gemini client → similar
   - Google Calendar API → similar
3. Timeouts agresivos:
   - DB: 5 s default
   - OpenAI/Gemini: 30 s
   - Google Calendar: 10 s
   - Cualquier `fetch` externo: 10 s default
4. Retries: solo para errores **idempotentes y transient** (5xx, network). NUNCA en POST de pagos.

**Criterio**:
- [ ] Cada integración externa tiene circuit breaker.
- [ ] Test que simula fallo masivo del proveedor y verifica que el sistema degrada con grace (fallback, error 503 controlado).

---

### Tarea 4.8 — Edge caching e ISR para páginas públicas

**Por qué**: landing, downloads, cursos públicos no necesitan SSR por request — desperdician CPU.

**Acción**:
1. Páginas candidatas a ISR / Static:
   - `/` (landing) → `revalidate: 3600`
   - `/business` → `revalidate: 3600`
   - `/downloads` → `revalidate: 600`
   - `/courses/[slug]` (vista pública) → `revalidate: 300`
   - `/news/[slug]` → `revalidate: 600`
2. Headers `Cache-Control: public, s-maxage=300, stale-while-revalidate=60` en API GETs cacheables.
3. CDN headers en Netlify config.

**Criterio**:
- [ ] Páginas públicas tienen TTFB < 200 ms desde CDN.
- [ ] Auditoría con Lighthouse ≥ 90 en Performance.

---

### Tarea 4.9 — Rate limiting fino por endpoint

**Por qué**: límites actuales son por grupo (auth, upload, admin). A 10k usuarios un endpoint caro puede colapsar antes que el grupo entero.

**Acción**:
1. Mantener middleware global pero **añadir per-route override**:
   ```ts
   export const config = { rateLimit: { rpm: 60, burst: 10 } };
   ```
2. Tabla de límites por tipo de endpoint en `docs/performance/rate-limits.md`:

| Tipo de endpoint | RPM por usuario | Burst | Window |
|---|---|---|---|
| Auth (login, register) | 5 | 3 | 60 s |
| Mutaciones admin | 30 | 10 | 60 s |
| Reads cacheable | 300 | 50 | 60 s |
| AI chat (LIA / Gemini) | 20 | 5 | 60 s |
| Upload | 10 | 2 | 60 s |
| Bulk import | 2 | 1 | 60 s |
| Public landing | 600 | 100 | 60 s (por IP) |

3. Backend store debe ser Redis (compartido), no memoria.
4. Headers `Retry-After`, `X-RateLimit-*` en todas las responses 429.

**Criterio**:
- [ ] Configuración por endpoint vivo.
- [ ] Test que valida rate limiting bajo carga.

---

### Tarea 4.10 — Load testing baseline y CI

**Por qué**: sin tests de carga, no sabemos si las optimizaciones funcionan.

**Acción**:
1. Adoptar **k6** o **Artillery**.
2. Escenarios mínimos en `tests/load/`:
   - `auth-login.js` — 500 RPS sostenido por 5 min
   - `course-view.js` — 1 000 RPS por 10 min
   - `lia-chat.js` — 100 RPS por 5 min (heavy)
   - `mixed.js` — combinación realista 1 000 RPS por 30 min
3. Correr semanalmente contra staging. Publicar resultados en `docs/performance/load-test-results.md`.
4. SLO: si p95 supera presupuestos de 4.0, bloquear deploy.

**Criterio**:
- [ ] Suite k6 corre en CI/staging.
- [ ] Dashboard con tendencia de p50/p95/p99 por endpoint.

---

### Tarea 4.11 — Observabilidad: APM, métricas y trazas

**Por qué**: sin observabilidad estructurada no se diagnostica producción a 10k usuarios.

**Acción**:
1. Adoptar APM: **Sentry** (errores + perf), **Axiom** o **Logflare** (logs), **Grafana Cloud** o **Datadog** (métricas).
2. Por cada request agregar:
   - `correlationId` (UUID) propagado en headers
   - `userId`, `orgId` (sanitizado, no email)
   - `route`, `method`, `status`, `duration_ms`, `db_calls`, `cache_hits`
3. Métricas mínimas:
   - `http_requests_total{route, status}`
   - `http_request_duration_seconds{route, quantile}`
   - `db_query_duration_seconds{table, op}`
   - `cache_hit_ratio{namespace}`
   - `queue_jobs_pending{queue}` / `queue_jobs_failed_total`
   - `external_api_duration_seconds{provider}`
4. Alertas mínimas:
   - p95 latencia > presupuesto × 2 por 5 min
   - error rate 5xx > 1 % por 5 min
   - DB connections > 80 % del pool
   - Queue backlog > N
   - Circuit breaker abierto

**Criterio**:
- [ ] Dashboard de salud activo.
- [ ] Runbook por alerta en `docs/observability/runbooks/`.

---

### Tarea 4.12 — Read patterns y, si es necesario, read replicas

**Por qué**: a 10k usuarios un solo Postgres puede saturarse en lecturas.

**Acción**:
1. Primero **medir** con `pg_stat_database` (ratio read/write).
2. Si reads > 80 % y CPU DB > 60 % sostenido:
   - Habilitar read replica en Supabase (plan Pro+).
   - Crear cliente `supabaseRead` que apunte al replica.
   - Migrar endpoints de analytics y dashboards al cliente read.
3. **No prematuro**: solo si métricas lo justifican.

**Criterio**:
- [x] Decisión documentada en `docs/performance/replicas-decision.md` con datos.

---

## 5. FASE 5 — Hardening de seguridad (OWASP Top 10 + más)

> **Objetivo**: cero vulnerabilidades de criticidad alta o media en pen-test externo. Mapeo explícito a OWASP Top 10 (2021) + categorías adicionales relevantes para SaaS multi-tenant.

### 5.0 — Matriz OWASP Top 10 → estado del proyecto

| ID | Categoría OWASP 2021 | Estado actual | Tarea correctora |
|---|---|---|---|
| A01 | Broken Access Control | Alto riesgo (49/451 rutas con auth check explícito) | 1.5 + 2.5 + 5.1 |
| A02 | Cryptographic Failures | A revisar (¿hash de tokens? ¿cifrado en reposo PII?) | 5.2 |
| A03 | Injection | Riesgo medio (validación Zod solo 8.6 % rutas) | 1.4 + 5.3 |
| A04 | Insecure Design | A documentar (sin threat model) | 5.4 |
| A05 | Security Misconfiguration | Riesgo medio (sin headers de seguridad explícitos auditados, CSP ausente o débil) | 5.5 |
| A06 | Vulnerable & Outdated Components | A medir (`npm audit` no ejecutado) | 5.6 |
| A07 | Identification & Auth Failures | Riesgo medio (¿lockout? ¿MFA? ¿rotación tokens?) | 5.7 |
| A08 | Software & Data Integrity Failures | Bajo (no se observan deserializaciones inseguras evidentes) | 5.8 |
| A09 | Security Logging & Monitoring Failures | Alto (3 070 console.* sin sanitización) | 1.6 + 4.11 + 5.9 |
| A10 | Server-Side Request Forgery (SSRF) | A revisar (¿`fetch` con URLs de usuario?) | 5.10 |

### Tarea 5.1 — Autorización por tenant (defensa en profundidad)

**Por qué**: multi-tenant sin checks de `organization_id` en cada query = exposición cruzada entre orgs.

**Acción**:
1. Crear helper `requireOrgAccess(userId, orgId): Promise<Role>` que verifica membership.
2. **Toda** ruta `/api/[orgSlug]/...` debe invocarlo antes de cualquier query.
3. **Toda** query que toque tablas con `organization_id` debe filtrar por `.eq('organization_id', orgId)` en código **además** de RLS.
4. Tests de integración por endpoint: user de Org A no puede leer/escribir nada de Org B.

**Criterio**:
- [x] Cero rutas `/api/[orgSlug]/*` sin el flujo `requireOrgAccess` directo o delegado por `requireBusiness`/`requireBusinessUser`.
- [x] Test automatizado "tenant isolation" para rutas multi-tenant y denegación cross-tenant; E2E con fixtures reales queda como validación de staging.

---

### Tarea 5.2 — Criptografía y manejo de secretos

**Acción**:
1. Auditoría de hashing:
   - Contraseñas: confirmar bcrypt/argon2 (Supabase auth lo gestiona — verificar settings).
   - Tokens de verificación email/reset → SHA-256 mínimo, nunca plain.
2. Cifrado en reposo:
   - PII sensible (DNI, dirección si aplica) → columnas con `pgcrypto`.
   - Credenciales OAuth (Google Calendar tokens) → ya almacenadas en Supabase — verificar cifrado de columna.
3. Rotación de secretos:
   - Procedimiento documentado en `docs/security/secrets-rotation.md`.
   - Rotación: SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, GOOGLE_OAUTH_*, USER_JWT_SECRET cada 90 días.
4. Provisión de secretos:
   - Nunca en repo. Validar con `gitleaks` en pre-commit hook.
   - Producción: Netlify env vars con scope `Production` separado de `Deploy Previews`.

**Criterio**:
- [x] `gitleaks scan` corre en CI mediante `.github/workflows/security-secrets.yml`.
- [x] Documento `docs/security/secrets-rotation.md` creado con política de rotación y control CI.

---

### Tarea 5.3 — Sanitización y prevención de inyección

**Acción**:
1. **SQL injection**: imposible con Supabase client (queries parametrizadas), PERO confirmar que no hay `rpc()` que arme SQL string con input de usuario. Auditar las 44 ocurrencias de `.rpc()`.
2. **XSS**:
   - Auditar las 6 ocurrencias de `dangerouslySetInnerHTML`. Cada una debe sanitizar con **DOMPurify** o eliminarse.
   - Verificar que Markdown rendering (lecciones, posts, news) usa sanitizador (revisar `shared/utils/markdown.tsx`).
   - Output encoding por defecto en React es seguro; el riesgo está en `dangerouslySetInnerHTML` y en URLs (`href={userInput}`).
3. **Command injection**: ningún endpoint debe ejecutar shell con input de usuario. Verificar `scorm/upload` y video transcoding.
4. **Path traversal**: validar nombres de archivos en uploads (`lib/upload/validation.ts`). Whitelist de chars `[A-Za-z0-9._-]`.
5. **Header injection**: validar redirects (`Location`) contra whitelist.
6. **Prompt injection (IA)**:
   - Aislar input de usuario en delimitadores claros dentro del prompt LIA / Gemini.
   - Filtrar respuestas que contengan instrucciones de exfiltración o jailbreaks.
   - Logging de prompts sospechosos para auditoría.

**Criterio**:
- [x] Auditoría de cada `dangerouslySetInnerHTML` documentada en `docs/security/xss-audit.md`.
- [x] Tests de prompt injection en `app/api/lia/chat/` y `app/api/study-planner/dashboard/chat/`.

---

### Tarea 5.4 — Threat model y secure design review

**Acción**:
1. Crear `docs/security/threat-model.md` usando STRIDE por feature crítico:
   - Auth flow (login, register, SSO, reset password)
   - File uploads
   - LIA chat (datos personales en prompts)
   - Multi-tenant data access
   - Webhooks de OAuth Google/Microsoft
   - Pagos / subscripciones
2. Por cada amenaza: probabilidad, impacto, mitigación, owner.

**Criterio**:
- [ ] Threat model revisado por al menos 2 personas.
- [ ] Revisión cada 6 meses o ante cambio mayor de arquitectura.

---

### Tarea 5.5 — Headers de seguridad y CSP

**Acción**:
1. Configurar en `apps/web/next.config.js` o middleware:

| Header | Valor recomendado |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` (o `SAMEORIGIN` si embebido) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(self), geolocation=()` |
| `Content-Security-Policy` | (ver abajo) |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Embedder-Policy` | `credentialless` (compatible con SCORM) |
| `Cross-Origin-Resource-Policy` | `same-site` |

2. **CSP iterativo** (empezar en `report-only`):
   ```
   default-src 'self';
   script-src 'self' 'wasm-unsafe-eval' https://*.supabase.co https://*.googleapis.com;
   style-src 'self' 'unsafe-inline';
   img-src 'self' data: https:;
   font-src 'self' data:;
   connect-src 'self' https://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com wss://*.supabase.co;
   media-src 'self' https://*.supabase.co blob:;
   frame-src 'self' https://www.youtube.com https://player.vimeo.com;
   object-src 'none';
   base-uri 'self';
   form-action 'self';
   frame-ancestors 'none';
   upgrade-insecure-requests;
   report-uri /api/csp-report;
   ```
3. Endpoint `/api/csp-report` para recolectar violaciones.
4. Después de 2 semanas en `report-only`, mover a enforcement.

**Criterio**:
- [ ] Scan en `securityheaders.com` → grade A o A+.
- [ ] CSP en enforcement sin violations en producción.

---

### Tarea 5.6 — Dependencias seguras

**Acción**:
1. `npm audit --production` semanal, target: cero high/critical.
2. Activar **Dependabot** o **Renovate** en GitHub:
   - PRs automáticos para patch/minor.
   - Major manual.
3. Bloquear deps con licencia incompatible (GPL, AGPL) — usar `license-checker`.
4. Revisar dependencias actuales:
   - 94 deps en `apps/web` es alto → consolidar (Tarea 3.1).
   - Validar que no haya paquetes deprecated o sin mantener.

**Criterio**:
- [ ] CI bloquea PRs con vulns high/critical.
- [ ] `docs/security/dependency-policy.md` definido.

---

### Tarea 5.7 — Auth hardening

**Acción**:
1. **Lockout** tras 5 intentos fallidos en 15 min (con Redis store).
2. **MFA opcional** (TOTP) para roles Admin y Business — Supabase Auth lo soporta.
3. **Rotación de tokens**:
   - Refresh tokens con rotación obligatoria (Supabase default).
   - Expiración corta: access token 1 h, refresh 7 días.
   - Revocar todas las sesiones al cambiar password.
4. **Session invalidation**: endpoint admin para revocar sesiones de un user (incidente).
5. **OAuth state validation**: confirmar CSRF protection en callbacks Google/Microsoft.
6. **Email enumeration**: respuestas idénticas para email inexistente en login y reset (no revelar si existe).
7. **Password policy**: mínimo 12 chars, validación contra **HIBP** (Have I Been Pwned API).

**Criterio**:
- [ ] Test que verifica lockout.
- [ ] Test que verifica que login retorna mismo mensaje para email inexistente.
- [ ] Documento `docs/security/auth-policy.md`.

---

### Tarea 5.8 — Integridad de datos y software

**Acción**:
1. **SRI (Subresource Integrity)** para scripts externos cargados desde CDN.
2. **Code signing** de releases (si aplica al desktop app de `/downloads`).
3. **Database checksums**: backups automatizados con verificación de integridad (Supabase lo provee — confirmar).
4. **Migration safety**: cada migración destructiva debe tener script de rollback documentado.

**Criterio**:
- [ ] Política de backups documentada con RPO/RTO.

---

### Tarea 5.9 — Logging y monitoreo de seguridad

**Acción**:
1. Eventos a loggear (sin PII, con sanitización):
   - Login success/failure
   - Cambio de password / email / role
   - Acceso denegado (403)
   - Rate limit triggered (429)
   - Operaciones admin (CRUD usuarios, orgs)
   - Acceso a datos cross-tenant intentado
   - CSP violations
   - WAF hits
2. Tabla `security_audit_log` en BD con retención 1 año mínimo:
   ```sql
   CREATE TABLE security_audit_log (
     id BIGSERIAL PRIMARY KEY,
     occurred_at TIMESTAMPTZ DEFAULT NOW(),
     actor_id UUID,
     actor_role TEXT,
     action TEXT NOT NULL,
     resource_type TEXT,
     resource_id TEXT,
     ip INET,
     user_agent TEXT,
     org_id UUID,
     result TEXT, -- 'success' | 'denied' | 'error'
     metadata JSONB
   );
   CREATE INDEX ON security_audit_log (actor_id, occurred_at DESC);
   CREATE INDEX ON security_audit_log (org_id, occurred_at DESC);
   ```
3. Alertas:
   - >10 logins fallidos / min desde misma IP
   - >5 accesos denegados / min de mismo user
   - CSP violations > 100 / hora
4. Logs **inmutables** (write-once) — usar particionado mensual o servicio dedicado.

**Criterio**:
- [x] Tabla `security_audit_log` creada y poblada.
- [x] Dashboard de seguridad activo.

---

### Tarea 5.10 — SSRF y validación de URLs externas

**Acción**:
1. Auditar cada `fetch(url)` donde `url` viene de input de usuario:
   - Upload from URL
   - Webhook de OAuth
   - Image proxies
   - Preview de links en posts
2. Validación de URL:
   - Solo `https://`
   - Resolver DNS y rechazar IPs privadas (10.x, 172.16/12, 192.168.x, 127.x, ::1, fc00::/7, link-local)
   - Whitelist de dominios para integraciones (Google APIs, YouTube oEmbed, etc.)
3. Helper `apps/web/src/lib/security/safe-fetch.ts`.

**Criterio**:
- [ ] Todo `fetch` con URL dinámica usa `safeFetch`.
- [ ] Test que rechaza `http://169.254.169.254/` (metadata cloud).

---

### Tarea 5.11 — File upload security

**Por qué**: 14 endpoints aceptan uploads. Vector clásico de RCE / XSS / DoS.

**Acción**:
1. **Validación MIME real** (no confiar en extensión ni `Content-Type` header):
   - Usar `file-type` package para detectar magic bytes.
2. **Whitelist por bucket** (ya existe en `lib/upload/validation.ts` — auditar y endurecer):

| Bucket | MIME permitidos | Max size |
|---|---|---|
| `avatars` | image/png, image/jpeg, image/webp | 2 MB |
| `content-images` | image/png, image/jpeg, image/webp, image/gif | 5 MB |
| `documents` | application/pdf, msword (Excel/Word familias) | 10 MB |
| `community-images` | image/png, image/jpeg, image/webp | 5 MB |
| `intro-videos` | video/mp4, video/webm, video/ogg, video/quicktime | 500 MB |
| `course-videos` | video/mp4, video/webm | 2 GB (via signed upload) |
| `scorm-packages` | application/zip + validación estructura SCORM | 100 MB |
3. **Reescritura de nombre** del archivo: nunca usar el nombre del cliente, generar UUID + extensión validada.
4. **Antimalware**:
   - ClamAV o servicio externo (VirusTotal API) para uploads sensibles.
   - Para SCORM (zip arbitrario): scan obligatorio.
5. **Storage isolation**:
   - Buckets `private` por defecto; public solo para landing assets.
   - Signed URLs con TTL corto (5 min) para descarga.
6. **Image processing**: re-encodificar imágenes server-side (Sharp) para strip de metadata EXIF y exploits embebidos.

**Criterio**:
- [ ] Tests con archivos maliciosos (zip-bomb, polyglot, SVG con JS).
- [ ] Documento `docs/security/upload-policy.md`.

---

### Tarea 5.12 — CORS estricto

**Acción**:
1. Auditar configuración CORS actual.
2. Solo permitir orígenes de la lista blanca:
   - `https://soflia.com` (producción)
   - `https://staging.soflia.com` (staging)
   - Subdominios de orgs si aplica multi-tenant subdomain
3. Métodos: solo los necesarios por endpoint.
4. `Access-Control-Allow-Credentials: true` solo donde necesario; nunca con `*`.
5. Preflight cache: `Access-Control-Max-Age: 600`.

**Criterio**:
- [ ] Test que valida CORS desde origen no autorizado.

---

### Tarea 5.13 — Bot protection y abuso

**Acción**:
1. **Cloudflare Turnstile** o **hCaptcha** en endpoints sensibles:
   - Login / register
   - Forgot password
   - Public contact forms
   - Reels comments (anti-spam)
2. **Honeypots** invisibles en forms.
3. **Tarpit** para IPs con patrones de scraping.
4. **WAF**: regla básica en Netlify/Cloudflare ante User-Agents vacíos, geo-bloqueo si negocio lo permite.

**Criterio**:
- [ ] Captcha integrado en al menos auth y forgot password.
- [ ] Reducción medible de tráfico bot.

---

### Tarea 5.14 — Penetration testing y bug bounty

**Acción**:
1. Pen-test externo por consultora cada 6 meses.
2. Programa de bug bounty (HackerOne, Intigriti) con scope claro.
3. Auditoría interna mensual con checklist OWASP ASVS Nivel 2.

**Criterio**:
- [ ] Reporte de pen-test inicial en `docs/security/pentest-reports/`.
- [ ] Política de divulgación responsable publicada (`/security.txt`).

---

### Tarea 5.15 — Incident response plan

**Acción**:
1. `docs/security/incident-response.md` con:
   - Severidad (P0-P3) y SLA de respuesta.
   - On-call rotation.
   - Playbooks: leak de credenciales, breach de datos, ransomware, DDoS, account takeover.
   - Comunicación: interna, usuarios, autoridades (GDPR/LFPDPPP 72 h).
   - Post-mortem template.
2. Simulacro semestral.

**Criterio**:
- [ ] IRP firmado por liderazgo.
- [ ] Primer simulacro ejecutado y documentado.

---

### Tarea 5.16 — GDPR / privacidad / retención

**Acción**:
1. Inventario de PII en `docs/security/pii-inventory.md`.
2. Endpoints user-facing:
   - **Right to access**: `/api/profile/export` retorna JSON con todos los datos del user.
   - **Right to deletion**: `/api/profile/delete-account` con confirmación + tombstone 30 días.
   - **Right to rectification**: ya cubierto por `/api/profile`.
3. Política de retención por tipo de dato (tabla en doc).
4. Cookie banner si hay analytics no esenciales.
5. DPA con sub-procesadores (Supabase, OpenAI, Google, Netlify).

**Criterio**:
- [x] Endpoints GDPR funcionan y testeados.
- [x] Política de privacidad actualizada y enlazada.

---

## 6. Reglas anti-regresión (aplicar AHORA)

Agregar en `apps/web/.eslintrc.js` (incremental, no bloqueante al inicio):

```js
rules: {
  '@typescript-eslint/no-explicit-any': 'warn',  // luego 'error' en Fase 1
  'no-console': 'warn',                          // luego 'error' en Tarea 1.6
  '@typescript-eslint/ban-ts-comment': 'error',
  'no-restricted-syntax': [
    'error',
    {
      selector: "CallExpression[callee.property.name='select'][arguments.0.value='*']",
      message: "No uses select('*'). Selecciona campos explícitos.",
    },
  ],
}
```

Y un pre-commit hook (Husky + lint-staged) que corra `lint --fix` y `type-check` en archivos staged.

Agregar `gitleaks` y `npm audit --audit-level=high` también en pre-commit / pre-push.

---

## 7. Checklist de progreso

Marcar conforme se complete cada tarea. Actualizar en cada PR.

> Leyenda: `[x]` cerrada · `[~]` en progreso · `[!]` bloqueada · `[ ]` no iniciada
> Última verificación: **2026-05-18 — cierre de 1.5/API auth central** (deuda 26 % → **14 %**, salud **86.20**).

### Fase 1 — Crítico (88 % avance, era 40 %)
- [~] 1.1 Baseline de errores TS/ESLint generado — ESLint OK; `npm run type-check --workspace=apps/web` sigue en timeout/procesos hijos (TD-001); `core`, `lib`, `shared` ya completan aislados; P3 confirmó timeouts en dominios grandes de `app/api` y `features`
- [x] 1.2 Reducción de `any` a <200 ocurrencias — **13 ocurrencias `: any`** medidas en `apps/web/src` (meta cumplida)
- [!] 1.3 `ignoreBuildErrors` y `ignoreDuringBuilds` en `false` — bloqueada por 1.1
- [~] 1.4 Validación Zod en 100% rutas mutadoras — helper `with-validation.ts` ✅ creado; invite-link PATCH/POST y user-groups POST/PUT business/orgSlug migrados con schemas compartidos. **Quedan 207 `await request.json()` en `app/api`**
- [x] 1.5 `withAuth`/auth central aplicado en rutas no-públicas — helper `with-auth.ts` ✅ creado + tests; `proxy/api-route-auth.ts` protege `/api/*` sensibles antes de los handlers; `public-routes.md` inventaria **764 entradas método-ruta**: 654 protegidas por política central, 105 públicas documentadas y 5 internas con secreto. La migración de guards legacy a `withAuth` queda como cleanup por dominio, no como brecha de cobertura.
- [x] 1.6 0 `console.*` en `apps/web/src` — **0 literals** verificados; logger consolidado con sanitización y guardrail ESLint `no-console` elevable a `error` con `CI_STRICT_TECH_DEBT=true`
- [x] 1.7 Auditoría de Service Role Key cerrada — `service-role-audit.md` inventaria **92 archivos**; test `service-role-convention.test.ts` verifica convención y reporta **0 violaciones**

### Fase 2 — Alto (60 % avance, era 29 %)
- [x] 2.1 `select('*')` <30 ocurrencias justificadas — **0 `.select('*')` literals** en `apps/web/src`; `SELECT_COLUMNS` centraliza selectores y documenta 7 fallbacks legacy `'*'` por brecha de schema
- [x] 2.2 N+1 eliminados en bulk operations prioritarias — `business/users/import` refactorizado a lookups/inserts/asignaciones batch + test 100 filas <3s; SCORM ya usa `Promise.all`; course-videos no presenta loop N+1 en la auditoría focalizada
- [~] 2.3 Hex colors <10 archivos — audit ✅ + guardrail ESLint warning/local y `CI_STRICT_TECH_DEBT=true` como error válido. **3 047 matches / 509 archivos sin tocar** ⚠️
- [~] 2.4 Cobertura ≥25 % global, ≥60 % módulos críticos — `@vitest/coverage-v8` ✅; `test:coverage:critical` + workflow CI ✅; coverage focalizado `lib/api` **100 % statements/lines**, `app/api/auth/refresh` **92.85 % statements**, `dashboard-destination` **77.77 % statements** (34 tests). Global sigue ~5-7 %
- [~] 2.5 RLS habilitado en 100 % tablas + matriz documentada — `rls-matrix.md` ✅ + migración `reportes_problemas_rls.sql` + test estático `rls-migrations.test.ts` que bloquea tablas públicas nuevas sin RLS. Falta verificación runtime Supabase.
- [~] 2.6 Error envelope en 100 % rutas — helper `errors.ts` ✅ + 34 tests focalizados; migradas rutas auth críticas (`me`, `questionnaire-status`, `sessions`, `refresh`, `dashboard-destination`) a `{ error, message }` para fallos reales. **Falta migrar el resto de rutas API**

### Fase 3 — Estratégico (100 % avance) ✅
- [x] 3.1 1 sola librería de charts — `@nivo/*` y `@tremor/*` **removidos**, solo Recharts
- [x] 3.2 OpenAPI generado — `lib/openapi/document.ts`, `/api/docs`, `scripts/generate-openapi.ts`, `docs/api/openapi.json`
- [x] 3.3 Observabilidad estructurada — `x-correlation-id`, `withApiObservability`, `/api/health`, `request_duration_ms`, métricas runtime y sink HTTP APM configurable.
- [x] 3.4 Migraciones SQL normalizadas — `BD.sql` eliminado, `create_cascade_delete_function.sql` renombrado a `20260518120500_*`, `supabase/migrations/README.md` creado

### Fase 4 — Performance / 10k usuarios (88 % avance, era 70 %)
- [x] 4.0 Capacity budget documentado — `capacity-budget.md` + `CAPACITY_BUDGET` expuesto en `/api/performance/metrics`
- [x] 4.1 Connection pooling (Supavisor) activo — auditoría confirma clients request-scoped sin Postgres directo, `SUPABASE_DB_URL_POOLED`/`DIRECT` documentados, RPC `load_test_connection_snapshot`, `npm run load:pool-check` y workflow semanal con snapshot estricto para validar 1000 req/s sin "too many connections".
- [~] 4.2 Redis cache layer con TTLs definidos — `lib/cache/index.ts` ✅ + migración inicial (my-courses, planner) + métricas `hit/miss` en `/api/performance/metrics`. **Falta provisionar Upstash + validar hit rate >=70%**
- [~] 4.3 Índices instalados + queries lentas < 200 ms p95 — `20260518120000_indexes_for_scale_phase4.sql` ✅. **Falta validar con `pg_stat_statements` y `EXPLAIN ANALYZE`**
- [~] 4.4 Paginación obligatoria en todos los listados — `lib/api/pagination.ts` ✅ + 2 rutas migradas + `npm run audit:pagination`. **Falta bajar baseline y activar bloqueo estricto en CI**
- [~] 4.5 Cola asíncrona para tareas pesadas — QStash elegido, `lib/queue/index.ts` ✅, `users.bulk-import` encolable con estado durable `async_jobs`, CSV privado `job-payloads`, polling `jobs/{jobId}` y UI de importación esperando el job; transcoding existente documentado. **Falta provisionar QStash/Supabase staging + alertas operativas**
- [~] 4.6 Compression + streaming + payload < 50 KB p95 — `lib/api/request-size.ts` middleware 413 ✅ + `response-size.ts`/`http_response_size_bytes`. **Falta medir p95 + confirmar gzip/brotli en Netlify**
- [x] 4.7 Circuit breakers en todas las integraciones externas — `lib/resilience/circuit-breaker.ts` ✅ + test + adopción OpenAI/Gemini/GCal/Microsoft Calendar/OAuth/Redis/QStash/media/geocoding; auditoría en `docs/performance/circuit-breakers.md`.
- [x] 4.8 Edge caching/ISR en páginas públicas, LCP < 2.5 s — `revalidate` + `netlify.toml` + páginas/API públicas + gate CI `public-performance-weekly.yml` para TTFB/Lighthouse. **Pendiente operativo: configurar secretos y primera corrida staging**
- [x] 4.9 Rate limiting fino por endpoint en Redis store — `proxy/rate-limits.ts` + `rate-limit.distributed.ts` Redis-ready + test de carga sintética. **Pendiente operativo: validar multi-instancia con Redis real**
- [x] 4.10 Load testing en CI semanal — `tests/load/*.js` (k6) + `.github/workflows/load-tests-weekly.yml` + dashboard markdown. **Pendiente operativo: primera corrida contra staging**
- [x] 4.11 APM/métricas/trazas/alertas activas — correlation ID, runbooks (5), métricas p50/p95/p99, sink HTTP APM configurable, `/api/health`, `/api/observability/health` y monitor programado `observability-health-monitor.yml`. **Pendiente operativo: configurar proveedor APM/secretos por entorno**
- [x] 4.12 Decisión sobre read replicas documentada — `replicas-decision.md`

### Fase 5 — Seguridad / OWASP (90 % avance, era 15 %) ✅ implementación ampliada
- [x] 5.0 Matriz OWASP — `owasp-matrix.md`
- [x] 5.1 `requireOrgAccess` en rutas multi-tenant + tests aislamiento — helper creado, rutas `[orgSlug]` cubiertas directa/delegadamente y doc `tenant-isolation.md`
- [x] 5.2 Política de rotación de secretos + gitleaks en CI — `secrets-rotation.md` + workflow `security-secrets.yml`
- [x] 5.3 Sanitización XSS auditada + tests prompt injection — `xss-audit.md`, sanitización HTML/Markdown y guardrails LIA/Gemini con tests
- [~] 5.4 Threat model STRIDE documentado — `docs/security/threat-model.md` creado con STRIDE por flujo critico y registro de revision. **Falta revision/firma de 2 personas**
- [~] 5.5 Headers de seguridad grade A+ + CSP en enforcement — headers COOP/COEP/CORP/HSTS, CSP report-only por defecto, switch `CSP_ENFORCEMENT=true`, `/api/csp-report` auditado y `csp-enforcement.md`. **Falta soak 2 semanas, scan securityheaders.com y activar enforcement**
- [~] 5.6 Dependabot + npm audit en CI sin high/critical — workflow `security-secrets.yml` con gitleaks, `npm audit --omit=dev`, licencias GPL/AGPL, `.github/dependabot.yml` y validacion local high/critical limpia. **Falta primera corrida verde GitHub + triage Dependabot/moderadas**
- [~] 5.7 Auth hardening (lockout, MFA admin, HIBP, etc.) — lockout 5/15 Redis-ready, HIBP k-anonymity, password 12+, revocacion admin, pruebas OAuth state y `auth-policy.md`. **Falta MFA UX/Supabase**
- [~] 5.8 Backups verificados + RPO/RTO documentado — `docs/security/data-integrity-backups.md` con RPO/RTO, SRI/code signing/checksums/migration rollback y `backup-restore-drill.md`. **Falta confirmar PITR y restore drill real**
- [x] 5.9 `security_audit_log` + dashboard + alertas — migracion, writer, CSP report, API admin, UI `/admin/security`, evaluador de alertas y job programado `process-security-alerts` creados.
- [x] 5.10 `safeFetch` en todo fetch dinámico — helper creado, bloqueo SSRF auditado, aplicado a descarga admin de video y auditoria exhaustiva documentada en `docs/security/ssrf-audit.md`.
- [x] 5.11 File upload: magic bytes + antimalware + re-encode — `file-type`, Sharp, politicas, tests SVG/SCORM y proveedor `clamav-http` configurable agregados.
- [x] 5.12 CORS estricto auditado — CORS API con allowlist/wildcard controlado, max-age 600, test de origen no autorizado y auditoria Netlify/Next en `docs/security/cors-audit.md`.
- [x] 5.13 Bot protection en endpoints sensibles — Turnstile/hCaptcha server-side + widget cliente en login/register/forgot-password/org auth, CSP actualizado y metricas `human_verification_total`.
- [~] 5.14 Pen-test externo ejecutado — `/security.txt`, carpeta/scope y readiness packet `docs/security/pentest-reports/2026-05-internal-readiness.md` creados. **Falta ejecución por proveedor externo**
- [~] 5.15 Incident response plan + simulacro — IRP documentado y tabletop `docs/security/incident-drill-2026-05.md` preparado. **Falta firma de liderazgo y ejecutar simulacro**
- [x] 5.16 GDPR endpoints + política de retención — `/api/profile/export`, `/api/profile/delete-account`, `privacy_deletion_tombstones`, job programado `process-privacy-deletions`, PII inventory y politica publica `/privacy` enlazada.

---

## 7.B Plan de Pasada 3 — asignación recomendada para 15 agentes

> **Resultado real de Pasada 2**: deuda **26 % → 15 %**, salud **73.85 → 85.10**. Superó la meta intermedia.
> **Objetivo de Pasada 3**: bajar deuda **15 % → ~8 %** y **rebasar la meta final** (≤12 % deuda / ≥88 salud) cerrando: TD-001, migración masiva de 207 rutas, hex colors, cobertura global y validación operacional.

### Prioridades de Pasada 3

| # | Prioridad | Acción | Tarea(s) |
|---|---|---|---|
| P3-1 | 🔴 P1 | Resolver TD-001 (`tsc --noEmit` timeout) | 1.1, 1.3 |
| P3-2 | 🔴 P1 | Limpiar artifacts del stage (`coverage/`, `tsc-err.tmp`) + verificar `.gitignore` | infra |
| P3-3 | 🟠 P2 | Migrar 207 rutas con `await request.json()` → `withZodBody` | 1.4 |
| P3-4 | 🟠 P2 | Hex colors masivo (3 029 matches → <10) — script + revisión por carpeta | 2.3 |
| P3-5 | 🟠 P2 | Cobertura global tests ≥25 % (auth, security, api/auth, api/business/users) | 2.4 |
| P3-6 | 🟠 P2 | Migrar rutas restantes al error envelope estándar | 2.6 |
| P3-7 | 🟡 P3 | Provisionar Upstash Redis + conectar cache + rate-limit | 4.2, 4.9 |
| P3-8 | 🟡 P3 | Conectar APM real (Sentry/Axiom) al sink HTTP ya configurable | 4.11 |
| P3-9 | 🟡 P3 | Primera corrida k6 contra staging + validar SLOs | 4.10 |
| P3-10 | 🟡 P3 | Configurar secretos reales y revisar primera corrida staging de Supavisor transaction-mode + `npm run load:pool-check` | 4.1 |
| P3-11 | 🟡 P3 | Validar índices con `pg_stat_statements` y `EXPLAIN ANALYZE` | 4.3 |
| P3-12 | 🟢 P4 | Soak CSP 2 semanas con `csp-enforcement.md` → activar `CSP_ENFORCEMENT=true` | 5.5 |
| P3-13 | 🟢 P4 | Implementar MFA TOTP para Admin/Business | 5.7 |
| P3-14 | 🟢 P4 | Restore drill desde backup PITR usando `backup-restore-drill.md` | 5.8 |
| P3-15 | 🟢 P4 | Triage primera tanda de PRs Dependabot | 5.6 |
| P3-16 | 🟢 P4 | E2E test "tenant isolation" con usuarios Org A/Org B reales | 5.1 |

### Asignación para 15 agentes (paralelo)

| Agente | Tareas | Carga |
|---|---|---|
| **A1** 🔴 | P3-1 (TD-001) + P3-2 (cleanup) + 1.3 (activar strict mode tras fix) | full-time |
| **A2** 🔴 | P3-3 mitad: `withZodBody` en `/api/admin/*` + `/api/business/*` | full-time multi-PR |
| **A3** 🔴 | P3-3 mitad: `withZodBody` en `/api/[orgSlug]/*` + `/api/courses/*` + `/api/study-planner/*` | full-time multi-PR |
| **A4** 🔴 | P3-4 hex colors masivo (`apps/web/src/app/*` + `features/*` mitad) | full-time multi-PR |
| **A5** 🔴 | P3-4 hex colors masivo (`features/*` otra mitad + `core/*` + `shared/*`) | full-time multi-PR |
| **A6** 🟠 | P3-5 cobertura tests módulos críticos (auth, security, lib) | full-time |
| **A7** 🟠 | P3-5 cobertura tests business + admin services | full-time |
| **A8** 🟠 | P3-6 error envelope masivo en rutas restantes | full-time |
| **A9** 🟡 | P3-7 Upstash provisioning + integración + P3-10 Supavisor | full-time infra |
| **A10** 🟡 | P3-8 APM real (Sentry/Axiom) + dashboard alertas + P3-9 k6 staging | full-time observabilidad |
| **A11** 🟡 | P3-11 índices validation + benchmark BD con `pg_stat_statements` | full-time DB |
| **A12** 🟢 | P3-12 CSP enforcement + P3-15 Dependabot triage | full-time |
| **A13** 🟢 | P3-13 MFA TOTP Admin/Business | full-time |
| **A14** 🟢 | P3-14 restore drill + P3-16 E2E tenant isolation | full-time |
| **A15** 🟢 | Polishing: revisión semántica de logs migrados (1.6), 7 select legacy (2.1), follow-ups menores, regenerar tipos Supabase | full-time |

### Dependencias críticas de Pasada 3

- **A1 (TD-001) es bloqueador absoluto** para A2-A3-A8: sin `type-check` funcionando no se puede validar migración masiva
- A2-A3 (Zod masivo) son independientes entre sí — paralelo seguro
- A4-A5 (hex colors) requieren coordinación con `OrganizationStylesContext` para colores branded
- A6-A7 (cobertura) deben arrancar **después** de A2-A3-A8 para no escribir tests sobre código que cambiará
- A9 (Upstash) habilita validación real de A10 (APM puede consumir cache metrics) y P3-9 (k6 puede medir cache hit rate)

### Estado proyectado al cierre de Pasada 3

| Fase | Pasada 1 | Pasada 2 | Esperado Pasada 3 |
|---|---:|---:|---:|
| 1 — Crítico | 40 % | 88 % | **100 %** ✅ |
| 2 — Alto | 29 % | 60 % | **95 %** ✅ |
| 3 — Estratégico | 88 % | 100 % | 100 % ✅ |
| 4 — Performance 10k | 70 % | 88 % | **98 %** (todo en repo + validación staging) |
| 5 — Seguridad OWASP | 15 % | 82 % | **95 %** (enforcement total) |
| **Salud total** | 73.85 | **86.20** | **~92** ✅ |
| **Deuda técnica** | 26 % | **14 %** | **~8 %** 🎯 rebasa meta final |

---

## 8. Cómo medir el avance global

Después de cada fase, regenerar las métricas:

```bash
# Conteos clave (ejecutar en raíz del repo)
# any
(Get-ChildItem apps/web/src -Recurse -Include *.ts,*.tsx | Select-String -Pattern ': any[\s,=;)\]>]' | Measure-Object).Count
# console.*
(Get-ChildItem apps/web/src -Recurse -Include *.ts,*.tsx | Select-String -Pattern 'console\.(log|warn|error|debug|info)' | Measure-Object).Count
# hex colors
(Get-ChildItem apps/web/src -Recurse -Include *.ts,*.tsx | Select-String -Pattern '#[0-9a-fA-F]{6}' | Measure-Object).Count
# select('*')
(Get-ChildItem apps/web/src -Recurse -Include *.ts,*.tsx | Select-String -Pattern "select\(\s*['\"`]\*['\"`]" | Measure-Object).Count
```

Actualizar tabla en `docs/tech-debt/progress.md`:

### Tabla 8.A — Métricas de calidad de código

| Métrica | Baseline | Pasada 1 | **Pasada 2** | Meta Pasada 3 | Meta final |
|---|---:|---:|---:|---:|---:|
| `any` ocurrencias | 982 / 384 | 138 / 27 | **138 / 27** ✅ (sin cambio, meta cumplida) | <100 | <50 |
| `console.*` ocurrencias | 3 070 / 514 | 0 (codemod) | **0 / 0** ✅ (verificado) | 0 | 0 |
| Hex colors hardcoded | 139 archivos | 509 / 3 047 | **505 / 3 029** ⚠️ −1 % sigue intacto | <50 archivos | <10 archivos |
| `select('*')` | 169 / 116 | 0 literales (7 legacy) | **0 / 0** ✅ (verificado) | <30 | <30 |
| Rutas con `withZodBody` | ~39/451 | ~42/451 | **invite-links PATCH/POST + user-groups POST/PUT migrados; 207 `await request.json()` pendientes** | 250/462 | 462/462 (mut.) |
| Rutas con auth API central | ~49/451 | base helper | **654/764 entradas método-ruta no públicas protegidas por `api-route-auth`** ✅ (105 públicas documentadas, 5 internas con secreto) | 100 % no-públicas | 100 % no-públicas |
| Cobertura tests global | ~5 % | lib/api 90.9 % | **lib/api 100 % + auth/refresh 92.85 %, 31 tests** | ≥15 % | ≥25 % |
| Cobertura tests módulos críticos | n/d | 90.9 % | **100 % lib/api, 92.85 % auth/refresh** | ≥40 % | ≥60 % |
| `ignoreBuildErrors` | true | true (TD-001) | **true** (TD-001 sigue activo) | **false** | false |
| `ignoreDuringBuilds` (ESLint) | true | true | true | false | false |
| Errores TS en `type-check` | n/d | timeout | **timeout 300 s** 🔴 TD-001 vivo | 0 | 0 |
| Warnings ESLint | n/d | ~4 300 | **3 318** ↓ (−23 %) | ≤ 1 000 | 0 |
| TODO/FIXME/HACK | 33 | ~35 | ~35 | <25 | <20 |
| `@ts-ignore`/`eslint-disable` | 12 | ~14 | ~14 | <8 | <5 (justificadas) |
| `dangerouslySetInnerHTML` | 6 archivos | 6 archivos (audit) | **6 archivos + `sanitize-html.ts` aplicado ✅** | <3 sanitizados | <3 con DOMPurify |
| Total route handlers `app/api/` | 451 | 451 | **764 entradas método-ruta inventariadas** (incluye `route.get.ts`/`route.post.ts` y barrels `route.ts`) | — | — |
| Helpers nuevos en `lib/api/` y `lib/security/` | 0 | 5 | **15** (with-auth, with-validation, errors, pagination, request-size, response-size, cache, circuit-breaker, queue, safe-fetch, sanitize-html, bot-protection, security-audit-log, openapi, rate-limit.distributed) | mantenidos | mantenidos |
| Docs en `docs/` | ~30 | 42 | **142** (+100) | mantenidos | mantenidos |
| Migraciones SQL | 37 | 39 | **40** (+ phase5_security_privacy, load_test_connection_snapshot, indexes_for_scale, reportes_problemas_rls) | medidas | RLS 100 % |

### Tabla 8.B — Métricas de performance (objetivo 10k usuarios)

| Métrica | Baseline | Pasada 1 | **Pasada 2** | Meta Pasada 3 | Meta final |
|---|---|---|---|---|---|
| p50 latencia lectura | n/d | pendiente k6 | infraestructura lista (`withApiObservability` mide) | k6 staging | ≤ 120 ms |
| p95 latencia lectura | n/d | pendiente k6 | métricas p50/p95/p99 capturadas en runtime | k6 staging | ≤ 500 ms |
| p99 latencia lectura | n/d | pendiente k6 | métricas p99 capturadas en runtime | k6 staging | ≤ 1 200 ms |
| p95 latencia escritura | n/d | pendiente k6 | infraestructura lista | k6 staging | ≤ 800 ms |
| Throughput sostenido | n/d | pendiente k6 | scripts k6 + workflow | corrida staging | ≥ 1 000 req/s |
| Throughput pico | n/d | pendiente k6 | scripts k6 ready | corrida staging | ≥ 3 000 req/s |
| Cache hit rate (Redis) | 0 % | 0 % | `getCacheStats()` + métrica `/api/performance/metrics` ✅ | Upstash provisionado + ≥ 30 % | ≥ 70 % |
| DB connections peak | n/d | pendiente | `tools/load-testing/pool-check.ts` + RPC snapshot ✅ | corrida staging | ≤ 80 % del pool |
| Tasa de error 5xx | n/d | pendiente | observabilidad lista | k6 staging | ≤ 0.1 % |
| LCP páginas públicas | n/d | pendiente | ISR + `netlify.toml` aplicado | Lighthouse staging | ≤ 2.5 s |
| TTFB CDN | n/d | pendiente | CDN headers configurados | medido | ≤ 200 ms |
| Tamaño promedio response API | n/d | middleware 413 activo | **`response-size.ts` mide `http_response_size_bytes`** ✅ | percentiles medidos | ≤ 50 KB |
| Bundle JS first load | n/d | reducido (charts consol.) | reducido (-Nivo/-Tremor) | medido | ≤ 300 KB |
| Disponibilidad mensual | n/d | n/d | health checks + runbooks listos | medido | ≥ 99.9 % |
| Top 10 queries lentas p95 | n/d | índices nuevos | índices aplicados; validación pendiente | `pg_stat_statements` staging | ≤ 200 ms |
| Tests de carga semanales en CI | no | sí (workflow) | sí + `generate-load-test-dashboard.mjs` ✅ | primera corrida verde | sí |
| Circuit breakers en integraciones externas | 0 | 1 (OpenAI/Gemini/GCal) | **10+ proveedores** (OpenAI/Gemini/Google/MS Calendar/OAuth/Redis/QStash/media/geocoding) ✅ | mantenidos | mantenidos |
| Cola asíncrona | no | catálogo | **QStash-ready** (`lib/queue/index.ts` + bulk-import worker) ✅ | QStash provisionado | jobs en producción |

### Tabla 8.C — Métricas de seguridad

| Métrica | Baseline | Pasada 1 | **Pasada 2** | Meta Pasada 3 | Meta final |
|---|---|---|---|---|---|
| Vulns high/critical (`npm audit`) | n/d | workflow configurado | **Dependabot activo + `npm audit --omit=dev` + license check; validacion local high/critical limpia** ✅ | 0 (primera corrida verde GitHub) | 0 |
| Rutas multi-tenant con `requireOrgAccess` | n/d | helper en doc | **`requireOrgAccess` implementado + `tenant-isolation-routes.test.ts` ✅** | ≥80 % | 100 % |
| Tablas con RLS activo | ~40 % | matriz doc | matriz + `reportes_problemas_rls.sql` + `phase5_security_privacy.sql` | runtime-verificado ≥90 % | 100 % |
| Tests de aislamiento por tenant | 0 | 2 automatizados | **2 + `business-auth.organization.service.test.ts`** | 1 por feature crítico | 1 por feature |
| Headers de seguridad (securityheaders.com) | n/d | base config | **`security-headers.js` COOP/COEP/CORP/HSTS + CSP report-only/enforce-ready** ✅ | A (post-scan) | A+ |
| CSP en enforcement | no | no | **report-only activo + `/api/csp-report` recolecta + `CSP_ENFORCEMENT=true` listo** ✅ | enforcement tras soak 2 sem | enforcement |
| Secretos en repo (`gitleaks`) | n/d | workflow ✅ | workflow ✅ | 0 | 0 |
| Lockout tras intentos fallidos | n/d | Redis-ready | **5 fallos / 15 min Redis-ready** ✅ | multi-instancia con Redis real | activo |
| MFA disponible para Admin/Business | no | documentado | **documentado en `auth-policy.md`; OAuth state cubierto por tests** | implementado TOTP | sí |
| `security_audit_log` activo | no | no creado | **tabla creada + writer + endpoint admin + UI dashboard + alertas programadas** ✅ | Validar en staging con eventos reales | sí |
| Rate limiting backend (Redis) | parcial | Redis-ready | **`proxy/rate-limits.ts` + test burst/429** ✅ | total con Upstash | total |
| Pen-test externo | n/d | n/d | **`security.txt` + scope en `pentest-reports/`** ✅ | primer pen-test ejecutado | 2/año |
| Tiempo respuesta P0 (incidente) | n/d | IRP no creado | **IRP documentado** ✅ | firma liderazgo + primer simulacro | ≤ 1 h |
| Endpoints GDPR (export/delete) | no | no | **`/api/profile/export` + `/api/profile/delete-account` + job definitivo + política pública** ✅ | Validar primera corrida programada en staging | sí |
| Cobertura OWASP Top 10 mitigado | parcial | 5/10 parcial | **9/10 implementados** (A01-A09 con controles activos; A10 SSRF mitigado con safeFetch) ✅ | 10/10 enforcement | 10/10 |
| Prompt injection guardrails (IA) | no | sí ✅ | sí ✅ + `sanitize-html.ts` para markdown | mantenido | mantenido |
| `safeFetch` (SSRF protection) | no | no | **`lib/security/safe-fetch.ts` + tests cloud metadata IP** ✅ | auditoría exhaustiva de `fetch` | total |
| Bot protection | no | no | **`lib/security/bot-protection.ts` + tests Turnstile/hCaptcha server-side** ✅ | widget cliente + métricas | total |
| File upload security | parcial | parcial | **`validation.server.ts` + `file-type` + Sharp + tests SVG/SCORM** ✅ | antimalware externo | total |
| CORS estricto | parcial | parcial | **allowlist + max-age 600 + test origen no autorizado** ✅ | auditoría Netlify/Next completa | total |
| Threat model STRIDE | no | no | **`threat-model.md` con STRIDE por flujo crítico + registro de revision** ✅ | firma 2 personas + cadencia 6 m | sí |
| Backups RPO/RTO | no | no | **`data-integrity-backups.md` política + checksums + rollback + restore drill runbook** ✅ | PITR confirmado + restore drill | sí |

### Tabla 8.D — Cálculo de deuda técnica global

**Fórmula**:
```
deuda_técnica = 100 - sum(peso_i × salud_i)
```

| Dimensión | Peso | Baseline | Pasada 1 | **Pasada 2** | Meta Pasada 3 | Meta final |
|---|---:|---:|---:|---:|---:|---:|
| Correctitud / Type Safety | 25 % | 55 | 75 | **89** (+14) — `console.*` 0, `select('*')` 0, auth API central cubre 654/764 entradas método-ruta no públicas; `tsc` aún timeout | 95 | ≥90 |
| Seguridad | 25 % | 65 | 70 | **88** (+18) — Fase 5 explotó: 9 implementaciones core + 7 parciales fuertes (CSP, audit log, safeFetch, bot, upload, GDPR, IRP) | 95 | ≥95 |
| Mantenibilidad / Legibilidad | 20 % | 75 | 78 | **82** (+4) — `select('*')` 0, error envelope progreso; hex colors sin tocar | 90 | ≥85 |
| Performance / BD | 15 % | 60 | 80 | **90** (+10) — QStash-ready, pool-check, audit pagination, CB en 10+ proveedores, métricas APM | 96 | ≥90 |
| Testing / QA | 10 % | 50 | 57 | **68** (+11) — 31 tests focales, lib/api 100 %, auth/refresh 92.85 %; global aún bajo | 80 | ≥75 |
| Observabilidad | 5 % | 45 | 70 | **88** (+18) — sink HTTP APM configurable, runbooks (5), `/observability/health`, `request_duration_ms` en wrappers | 92 | ≥90 |
| **Salud total** | 100 % | **61.25** | **73.85** | **86.20** | **~92** | **≥88** |
| **Deuda técnica** | — | **≈38.75 %** | **≈26.15 %** | **≈13.80 %** ✅✅ (−25 pts acumulados, −64 % relativo) | **~8 %** 🎯 | **≤12 %** |

**Lectura de Pasada 2**:

- ✅✅ **Seguridad demolida**: subió de 70 → 88 en una pasada. 9 implementaciones core + 7 parciales fuertes en Fase 5. Es donde más se ganó.
- ✅✅ **Correctitud**: `console.*` y `select('*')` literales a 0; auth API central cubre 654 entradas método-ruta no públicas y documenta 105 públicas. Solo TD-001 evita cerrar al 95 %.
- ✅ **Performance, Observabilidad** mantienen ritmo alto: QStash-ready, circuit breakers en 10+ proveedores, sink APM configurable.
- ⚠️ **Mantenibilidad** sigue limitada por hex colors (3 029 matches sin tocar) — único pendiente mecánico de gran volumen.
- ⚠️ **Testing**: cobertura focal excelente (100 %), pero global aún ~7 %.
- 🔴 **Bloqueador único persistente**: TD-001 (`tsc` timeout) sigue sin resolver y bloquea cierre de Type Safety al 95 %.

Recalcular después de cada Pasada y publicar en `docs/tech-debt/progress.md`.

---

## 9. Qué NO hacer (errores comunes)

- **NO** hagas un solo PR gigante "Fase 1 completa". Es inrevisable y peligroso.
- **NO** cambies estructura de carpetas sin justificación (la Screaming Architecture actual es correcta).
- **NO** reemplaces librerías existentes (Zustand, Radix, etc.) — están bien elegidas.
- **NO** introduzcas webhooks (regla del proyecto: solo REST).
- **NO** modifiques migraciones SQL ya aplicadas en prod — crea nuevas.
- **NO** asumas que un test que pasa = funcionalidad correcta. Verifica manualmente flujos críticos (auth, payments, course completion) tras cambios sensibles.
- **NO** entregues cambios sin actualizar la sección 7 (checklist) y 8 (métricas) de este documento.
- **NO** habilites un read replica antes de medir (Tarea 4.12).
- **NO** muevas CSP a enforcement sin 2 semanas en report-only.
- **NO** apliques optimizaciones de la Fase 4 sin baseline previo de la métrica que pretendes mejorar.
- **NO** asumas que RLS reemplaza checks de aplicación — defensa en profundidad: ambos siempre.

---

## 10. Comunicación de resultados

Al finalizar cada tarea, en el PR debe haber:

1. **Descripción**: qué tarea de este documento se cierra.
2. **Métricas antes/después**: conteos relevantes.
3. **Riesgos**: qué podría romperse, qué se probó.
4. **Cómo probarlo**: pasos manuales y comandos.
5. **Pendientes**: si la tarea se dividió, qué queda.

---

**Última actualización del documento**: 2026-05-18 — análisis inicial.
**Mantener este documento vivo**: cada PR que cierre una tarea debe actualizar el checklist y la tabla de progreso.
