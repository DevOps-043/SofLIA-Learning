# CODEX TASK — Type Safety y Type-Check Global

**Peso en TDI:** 10% | **Deuda residual actual:** ~35%
**Fecha de corte:** 2026-04-02 (worktree real)

---

## Estado real medido en worktree

```
Ocurrencias `: any / as any` en producción: 1,090
```

Distribución por módulo (medición directa con grep):

| Módulo | Ocurrencias | Nota |
|---|---|---|
| `features/admin/` | **189** | Declarado "limpio" — se recontaminó con código nuevo |
| `features/courses/` | **112** | — |
| `features/study-planner/` | **92** | — |
| `app/` (orgSlug + business) | **71** | Routes del business panel |
| `core/` | **80** | Stores Zustand y providers |
| `features/instructor/` | **78** | — |
| `features/business-panel/` | **69** | — |
| `features/communities/` | **52** | — |
| Otros módulos | ~347 | auth, lia, notifications, etc. |

> La cuenta subió de ~309 (reportado anteriormente) a 1,090 porque el último lote de Codex
> agregó código nuevo sin tipar correctamente. El módulo `admin` es el caso más crítico.

---

## Ya resuelto — NO rehacer

- `auditLog.service.ts` tipado correctamente ✅
- `lib/supabase/server.ts` — tipos correctos post-refactorización ✅
- `useInstructorCommunityDetail.ts` — 4 interfaces nuevas, sin `any` ✅

---

## Pendiente — dos frentes separados

### FRENTE 1 — Errores de type-check global en `lib/`

Estos errores bloquean el build limpio. Corregirlos es prerequisito para declarar que
el type-check global pasa.

| Archivo | Error | Descripción |
|---|---|---|
| `lib/utils/logger.ts` | TS2774 x4 | Condición siempre verdadera/falsa |
| `lib/subscription/subscriptionHelper.ts` | TS2307 x2 | Módulos no encontrados |
| `lib/utils/organization-query.ts` | TS2707 x2 | Tipo no iterable |
| `lib/validation/password-security.ts` | TS2558 | Demasiados argumentos de tipo genérico |
| `lib/sanitize/enhanced-dom-purify.ts` | TS18046 | Variable `unknown` usada sin narrowing |
| `lib/scorm/parser.ts` | TS2345 | Argumento de tipo incorrecto |
| `lib/supabase/pool.ts` | TS2345 | Tipo incorrecto en pool de conexiones |

Orden de corrección (máximo impacto primero):

1. `lib/utils/logger.ts` (TS2774 x4) — 4 errores en 1 archivo
2. `lib/subscription/subscriptionHelper.ts` (TS2307 x2) — módulos faltantes
3. `lib/utils/organization-query.ts` (TS2707 x2) — iteración incorrecta
4. `lib/validation/password-security.ts` (TS2558) — crítico: seguridad
5. `lib/sanitize/enhanced-dom-purify.ts` (TS18046) — sanitización HTML
6. `lib/scorm/parser.ts` (TS2345) — parser SCORM
7. `lib/supabase/pool.ts` (TS2345) — infraestructura BD

```bash
# Verificar errores actuales
npm run type-check --workspace=apps/web 2>&1 | grep "error TS" | wc -l

# Ver un error específico
npm run type-check --workspace=apps/web 2>&1 | grep -A 5 "logger.ts"
```

Para cada corrección: **1 commit por archivo** para poder revertir si rompe algo.

---

### FRENTE 2 — 1,090 ocurrencias de `any` en módulos activos

Atacar por módulo en orden de impacto:

**TAREA 2A — `features/admin/` (189 ocurrencias) — PRIORIDAD MÁXIMA**

Este módulo fue declarado limpio y se recontaminó. Atacar primero los servicios:

```bash
# Archivos con más any en admin
grep -rn ": any\|as any" apps/web/src/features/admin/ --include="*.ts" --include="*.tsx" -l | \
  xargs -I{} sh -c 'echo "$(grep -c "any" {}) {}"' | sort -rn | head -10
```

**TAREA 2B — `features/courses/` (112 ocurrencias)**

Revisar especialmente:
- `hooks/useLearnPageLogic.ts` — manejo de estado del curso
- Servicios que transforman datos de lecciones/módulos

**TAREA 2C — `features/study-planner/` (92 ocurrencias)**

```bash
grep -rn ": any\|as any" apps/web/src/features/study-planner/ --include="*.ts" | wc -l
```

**TAREA 2D — `core/` (80 ocurrencias)**

Stores Zustand y providers — los types de estado son especialmente importantes aquí.

Patrones de corrección:

```typescript
// 1. Props de componente sin tipar
// ❌
function Component({ data }: { data: any }) {}
// ✅
interface ComponentProps { data: StudySession }
function Component({ data }: ComponentProps) {}

// 2. Respuesta de Supabase sin tipar
// ❌
const { data }: { data: any } = await supabase.from('study_sessions').select()
// ✅ — usar tipos generados en lib/supabase/types.ts
const { data } = await supabase
  .from('study_sessions')
  .select('id, user_id, start_time, end_time')
// data se infiere automáticamente del schema generado

// 3. JSON.parse sin tipo
// ❌
const parsed: any = JSON.parse(text)
// ✅
const parsed = JSON.parse(text) as StudyPlanResponse

// 4. Callbacks sin tipar
// ❌
handlers.forEach((h: any) => h())
// ✅
handlers.forEach((h: () => void) => h())
```

---

### FRENTE 3 — Tipos faltantes en interfaces de Supabase

**TAREA 3A — Tipar respuestas de `lib/supabase/looseQuery.ts`**

Las queries en `looseQuery.ts` usan tablas fuera del schema generado. Agregar tipos manuales
en `lib/supabase/looseQuery.types.ts`:

```typescript
export interface CommunityMember {
  user_id: string
  community_id: string
  role: 'member' | 'admin' | 'moderator'
  joined_at: string
}
```

**TAREA 3B — Tipos para respuestas de endpoints agregados**

Los endpoints creados retornan objetos compuestos sin tipo explícito en el cliente.
Agregar en `features/[feature]/types.ts` o `lib/types/api.ts`:

```typescript
export interface CourseFullResponse {
  course: CourseRow
  modules: ModuleRow[]
  instructor: InstructorProfile
  enrollment: EnrollmentRow | null
}
```

---

## Reglas para Codex en este módulo

1. **Corregir errores de `lib/` primero** — desbloquean el type-check global.
2. **No usar `as any` como solución** — es mover el problema, no resolverlo.
3. **Crear interfaces antes de eliminar `any`** — el tipo debe estar definido primero.
4. **Mantener compatibilidad de runtime** — cambiar tipos no debe cambiar el comportamiento.
5. **Un archivo = un commit** para los errores de `lib/`. Así se puede revertir si rompe algo.
6. **Correr type-check después de cada archivo** para confirmar que el error desapareció.
7. **No introducir `any` nuevo** en ningún código que se toque — regla absoluta.

## Verificación

```bash
# Verificar que los errores de lib/ van bajando
npm run type-check --workspace=apps/web 2>&1 | grep "error TS" | wc -l
# Objetivo: 0

# Contar any restante por módulo
grep -rn ": any\|as any" apps/web/src/features/admin/ --include="*.ts" | wc -l
grep -rn ": any\|as any" apps/web/src/features/courses/ --include="*.ts" | wc -l
grep -rn ": any\|as any" apps/web/src/features/study-planner/ --include="*.ts" | wc -l

# Correr tests después de cada corrección de tipo
cd apps/web && npx vitest run --reporter=verbose src/features/admin/
```

## Métrica de éxito

- **0 errores de type-check global** (`npm run type-check --workspace=apps/web` pasa limpio)
- `any` en `admin` reducido de 189 a <30
- `any` en `courses` reducido de 112 a <20
- `any` en `study-planner` reducido de 92 a <20
- `any` total en producción reducido de 1,090 a <400
- `lib/supabase/looseQuery.ts` con tipos explícitos para todas sus tablas
- TDI Type Safety: de ~35% a ~15%
