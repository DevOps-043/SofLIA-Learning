# CODEX TASK — Type Safety y Type-Check Global

**Peso en TDI:** 10% | **Deuda residual estimada:** ~15-18%
**Fecha de corte:** 2026-04-01
**Estado:** Parcialmente resuelto — módulos `admin` e `instructor` limpios.
Quedan ~309 ocurrencias de `any` y 12 errores de type-check en `lib/`.

---

## Lo que ya está hecho (NO tocar)

- Módulo `admin` completo: **0 ocurrencias de `any`** ✅
- Módulo `instructor` completo: **0 ocurrencias de `any`** ✅
- `auditLog.service.ts` tipado correctamente (error `action/Json` resuelto) ✅
- `lib/supabase/server.ts` — tipos correctos post-refactorización ✅
- `useInstructorCommunityDetail.ts` — 4 interfaces nuevas, sin `any` ✅

---

## Pendiente — dos frentes separados

### FRENTE 1 — 12 errores de type-check global en `lib/`

Estos errores están en archivos de infraestructura transversal. Bloquean el build limpio.
**Corregirlos es prerequisito para poder declarar que el type-check global pasa.**

| Archivo | Error | Descripción |
|---|---|---|
| `lib/sanitize/enhanced-dom-purify.ts` | TS18046 | Variable de tipo `unknown` usada sin narrowing |
| `lib/scorm/parser.ts` | TS2345 | Argumento de tipo incorrecto en parser |
| `lib/subscription/subscriptionHelper.ts` | TS2307 x2 | Módulos no encontrados |
| `lib/supabase/pool.ts` | TS2345 | Tipo incorrecto en pool de conexiones |
| `lib/utils/logger.ts` | TS2774 x4 | Expresión siempre truthy/falsy |
| `lib/utils/organization-query.ts` | TS2707 x2 | Tipo iterado incorrectamente |
| `lib/validation/password-security.ts` | TS2558 | Demasiados argumentos de tipo |

**TAREA 1A — Corregir `lib/utils/logger.ts` (TS2774 x4)**

TS2774 = "This condition will always return true since this function is always defined"
Típicamente indica un check innecesario como `if (typeof console !== 'undefined')`.

```bash
# Ver el error exacto con líneas
npm run type-check --workspace=apps/web 2>&1 | grep -A 5 "logger.ts"
```

Fix esperado: eliminar los checks siempre-verdaderos o refactorizar la condición.

**TAREA 1B — Corregir `lib/subscription/subscriptionHelper.ts` (TS2307 x2)**

TS2307 = "Cannot find module". Los módulos importados no existen o la ruta es incorrecta.

```bash
npm run type-check --workspace=apps/web 2>&1 | grep -A 8 "subscriptionHelper"
```

Opciones:
1. Si el módulo se movió: actualizar el import
2. Si el módulo no existe: crear el stub o usar la exportación correcta
3. Si es un package externo: agregarlo a `package.json`

**TAREA 1C — Corregir `lib/utils/organization-query.ts` (TS2707 x2)**

TS2707 = "Missing a `[Symbol.iterator]`" — el código itera algo que no es iterable.

```bash
npm run type-check --workspace=apps/web 2>&1 | grep -A 8 "organization-query"
```

**TAREA 1D — Corregir `lib/validation/password-security.ts` (TS2558)**

TS2558 = "Expected X type arguments but got Y". Un genérico recibe más tipos de los que acepta.

```bash
npm run type-check --workspace=apps/web 2>&1 | grep -A 8 "password-security"
```

**TAREA 1E — Corregir `lib/sanitize/enhanced-dom-purify.ts` (TS18046)**

TS18046 = "X is of type 'unknown'" — una variable `unknown` se usa sin type guard previo.

```typescript
// ❌ Error
function sanitize(input: unknown) {
  return input.toString() // TS18046: Object is of type 'unknown'
}

// ✅ Fix
function sanitize(input: unknown) {
  if (typeof input !== 'string') return ''
  return input.toString()
}
```

**TAREA 1F — Corregir `lib/scorm/parser.ts` (TS2345) y `lib/supabase/pool.ts` (TS2345)**

TS2345 = "Argument of type X is not assignable to parameter of type Y".
Leer el error exacto para entender qué tipos están implicados.

---

### FRENTE 2 — ~309 ocurrencias de `any` en dominos activos

**Distribución estimada:**
- `features/study-planner/` — ~120 ocurrencias
- `features/business-panel/` — ~110 ocurrencias
- `features/courses/` — ~80 ocurrencias

**TAREA 2A — Eliminar `any` en `features/study-planner/`**

```bash
# Ver archivos con más `any` en study-planner
grep -rn ": any\|as any\|<any>" apps/web/src/features/study-planner/ \
  --include="*.ts" --include="*.tsx" | wc -l

# Top archivos por ocurrencia
grep -rn ": any\|as any\|<any>" apps/web/src/features/study-planner/ \
  --include="*.ts" --include="*.tsx" -l | \
  xargs -I{} sh -c 'echo "$(grep -c "any" {}) {}"' | sort -rn | head -10
```

Patrón de corrección por tipo de `any`:

```typescript
// 1. Props de componente sin tipar
// ❌
function Component({ data }: { data: any }) {}
// ✅ — crear interfaz
interface ComponentProps { data: StudySession }
function Component({ data }: ComponentProps) {}

// 2. Respuesta de Supabase sin tipar
// ❌
const { data }: { data: any } = await supabase.from('study_sessions').select()
// ✅ — usar tipos generados
const { data }: { data: StudySession[] | null } = await supabase...

// 3. Parámetros de callback
// ❌
handlers.forEach((h: any) => h())
// ✅
handlers.forEach((h: () => void) => h())

// 4. JSON.parse sin tipo
// ❌
const parsed: any = JSON.parse(text)
// ✅
const parsed = JSON.parse(text) as StudyPlanResponse
```

**TAREA 2B — Eliminar `any` en `features/business-panel/`**

Prioridad dentro del módulo (más impacto primero):
1. `services/` — servicios server-side con queries Supabase
2. `hooks/` — hooks con estado complejo
3. `components/` — props de componentes

**TAREA 2C — Eliminar `any` en `features/courses/`**

Revisar especialmente:
- `hooks/useLearnPageLogic.ts` — manejo de estado del curso
- Servicios que transforman datos de lecciones/módulos

---

### FRENTE 3 — Tipos faltantes en interfaces de Supabase

**TAREA 3A — Tipar respuestas de `looseQuery.ts`**

Las queries en `looseQuery.ts` usan tablas fuera del schema generado. Agregar tipos manuales:

```typescript
// lib/supabase/looseQuery.types.ts
export interface CommunityMember {
  user_id: string
  community_id: string
  role: 'member' | 'admin' | 'moderator'
  joined_at: string
}

export interface CommunityAccessRequest {
  id: string
  user_id: string
  community_id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}
```

**TAREA 3B — Tipos para respuestas de endpoints agregados**

Los endpoints creados en este programa retornan objetos compuestos sin tipo explícito.

```typescript
// Agregar en features/courses/types.ts o lib/types/api.ts
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

## Verificación

```bash
# Verificar que los 12 errores de lib/ van bajando
npm run type-check --workspace=apps/web 2>&1 | grep "error TS" | wc -l
# Objetivo: 0

# Contar `any` restante por módulo
grep -rn ": any\|as any" apps/web/src/features/study-planner/ --include="*.ts" | wc -l
grep -rn ": any\|as any" apps/web/src/features/business-panel/ --include="*.ts" | wc -l
grep -rn ": any\|as any" apps/web/src/features/courses/ --include="*.ts" | wc -l

# Correr tests después de cada corrección de tipo
npx vitest run --reporter=verbose apps/web/src/features/study-planner/
```

## Métrica de éxito

- **0 errores de type-check global** (`npm run type-check --workspace=apps/web` pasa limpio)
- `any` en `study-planner` reducido de ~120 a <30
- `any` en `business-panel` reducido de ~110 a <30
- `any` en `courses` reducido de ~80 a <20
- `lib/supabase/looseQuery.ts` con tipos explícitos para todas sus tablas

## Orden recomendado de corrección (máximo impacto primero)

1. `lib/utils/logger.ts` (TS2774 x4) — 4 errores en 1 archivo
2. `lib/subscription/subscriptionHelper.ts` (TS2307 x2) — 2 errores, módulos faltantes
3. `lib/utils/organization-query.ts` (TS2707 x2) — 2 errores
4. `lib/validation/password-security.ts` (TS2558) — seguridad
5. `lib/sanitize/enhanced-dom-purify.ts` (TS18046) — sanitización
6. `lib/scorm/parser.ts` (TS2345)
7. `lib/supabase/pool.ts` (TS2345) — infraestructura BD
