# CODEX TASK — Optimización de Queries y Performance

**Peso en TDI:** parte del 10% de BD + parte del 20% de Arquitectura
**Deuda residual actual:** múltiples N+1 confirmados en hotspots pendientes
**Fecha de corte:** 2026-04-02 (worktree real)

---

## Ya resuelto — NO tocar

| Área | Estado |
|---|---|
| `adminCommunityContent.service.ts` — N+1 comentarios/reacciones → bulk + mapa | ✅ |
| `app/api/courses/[slug]/full/route.ts` — múltiples queries → 1 payload agregado | ✅ |
| `app/api/[orgSlug]/business/analytics/route.ts` — full scan eliminado | ✅ |
| `analytics-identity.service.ts` — matching email/UUID en mapa O(n) | ✅ |
| `adminCommunityMembers.service.ts` — `find()` sobre arrays → mapas | ✅ |
| `useCommunityDetail.ts` — 5 fetches cliente → 1 endpoint agregado | ✅ |
| `profile-server.service.ts` — stats en `Promise.all`, short-circuit | ✅ |
| `app/[orgSlug]/business-user/dashboard/page.tsx` — org + dashboard en `Promise.all` | ✅ |
| `features/business-panel/services/businessUsers.server.service.ts` | 635 → **76** ✅ |

### Índices de performance creados ✅

Ver `06-base-de-datos.md` — migración `20260402113000_planner_notifications_query_indexes.sql`:
- `idx_calendar_integrations_user_provider_updated_at`
- `idx_study_sessions_user_plan_start_time`
- `idx_study_sessions_calendar_sync_lookup`
- `idx_user_notifications_unread_priority_expires_at`

---

## Pendiente — por impacto de performance

### BLOQUE 1 — Servicios grandes con N+1 probable

**TAREA 1A — Auditar `features/business-panel/services/analytics/analytics-response.service.ts` (694 líneas)**

Este servicio tiene lógica de agregación compleja. Verificar:
1. ¿Hace queries dentro de loops por usuario/equipo?
2. ¿Filtra en memoria arrays grandes que deberían filtrarse en SQL?
3. ¿Hace múltiples `.count()` que podrían ser un solo query con `GROUP BY`?

Patrón a buscar (N+1 clásico):
```typescript
// ❌ N+1 — una query por usuario
for (const user of users) {
  const stats = await supabase.from('study_sessions').select('*').eq('user_id', user.id)
}

// ✅ Corrección — bulk fetch + agrupado
const userIds = users.map(u => u.id)
const { data: allStats } = await supabase
  .from('study_sessions').select('*').in('user_id', userIds)
const statsByUser = Object.fromEntries(allStats.map(s => [s.user_id, s]))
```

**TAREA 1B — Auditar `features/study-planner/services/course-analysis.service.ts` (428 líneas)**

Reducido de 668 pero sigue en 428. El análisis de cursos para el planner puede hacer
queries repetidas por lección/módulo.

Buscar en el archivo:
1. Loops con `await supabase.from(...)` dentro — cada uno es un N+1
2. Múltiples llamadas separadas que podrían fusionarse con `.select('*, modulos(*, lecciones(*))')`
3. Transformaciones sobre arrays con `.find()` — reemplazar con mapas

**TAREA 1C — Auditar `features/admin/services/adminLessons.service.ts` (675 líneas)**

CRUD de lecciones. Candidato a N+1 en la carga de materiales por lección.

```bash
grep -n "await.*supabase\|for.*of\|forEach" \
  apps/web/src/features/admin/services/adminLessons.service.ts | head -30
```

Separación esperada (ver `01-arquitectura-modularidad.md` TAREA 2G):
```
features/admin/services/admin-lessons/
├── admin-lessons.service.ts            # facade ≤80 líneas
├── admin-lessons-query.service.ts
├── admin-lessons-mutation.service.ts
├── admin-lessons-materials.service.ts
└── __tests__/admin-lessons.service.test.ts
```

---

### BLOQUE 2 — Queries de alto volumen sin optimizar

**TAREA 2A — Notificaciones: query de conteo de no-leídas**

Verificar en `features/notifications/services/notification/query.service.ts`:

```typescript
// ❌ Ineficiente — count en memoria
const { data } = await supabase
  .from('user_notifications').select('*')
  .eq('user_id', userId).eq('status', 'unread')
// count = data.length

// ✅ Eficiente — count en DB
const { count } = await supabase
  .from('user_notifications')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId).eq('status', 'unread')
```

**TAREA 2B — Study Sessions: verificar uso de índices en queries de rango**

Los índices `idx_study_sessions_user_plan_start_time` y `idx_study_sessions_calendar_sync_lookup`
ya existen. Verificar que las queries los usan correctamente:

```bash
grep -r "study_sessions" apps/web/src/features/study-planner/services/ --include="*.ts" -l
```

Para cada servicio: el filtro por `user_id` debe ser el primer predicado en el `WHERE`.

---

### BLOQUE 3 — Queries paralelas en servicios de analytics

**TAREA 3A — `features/business-panel/services/analytics/global-analytics-response.service.ts` (625 líneas)**

Descubierto en el último barrido. Creado durante la refactorización — posible candidato a N+1
igual que `analytics-response.service.ts`.

```bash
wc -l apps/web/src/features/business-panel/services/analytics/global-analytics-response.service.ts
```

Patrón de paralelización:
```typescript
// ❌ Secuencial
const activeUsers = await getActiveUsers(orgId, range)
const completionRate = await getCompletionRate(orgId, range)
const topCourses = await getTopCourses(orgId, range)

// ✅ Paralelo
const [activeUsers, completionRate, topCourses] = await Promise.all([
  getActiveUsers(orgId, range),
  getCompletionRate(orgId, range),
  getTopCourses(orgId, range),
])
```

---

### BLOQUE 4 — Selects innecesariamente amplios

**TAREA 4A — Auditar `.select('*')` en servicios de producción**

```bash
grep -rn "\.select\('\*'\)" apps/web/src/features/ --include="*.ts" | head -30
```

Para cada ocurrencia: especificar solo los campos que se usan.

```typescript
// ❌ Trae 20 columnas para usar 3
const { data } = await supabase.from('usuarios').select('*').eq('id', userId)

// ✅ Solo lo necesario
const { data } = await supabase
  .from('usuarios')
  .select('id, email, first_name, last_name, role')
  .eq('id', userId)
```

Prioridad: servicios que consultan tablas grandes (`usuarios`, `study_sessions`, `lecciones`).

---

### BLOQUE 5 — Caché en endpoints de datos estables

**TAREA 5A — Agregar revalidate en endpoints de catálogo**

```typescript
// Solo para datos que cambian poco (NO para datos de usuario)
export const revalidate = 3600 // 1 hora

// Candidatos:
// app/api/courses/[slug]/full/route.ts — detalle de curso público
```

No cachear: notificaciones, sesiones del planner, progreso de lecciones, datos de usuario.

---

## Reglas para Codex en este módulo

1. **Medir antes de optimizar.** Para cada N+1 sospechoso: leer el código y confirmar antes de cambiar.
2. **No cachear datos de usuario.** Solo datos estables (catálogo, configuración de org).
3. **`Promise.all` para queries independientes**, nunca `await` secuencial para queries que no dependen entre sí.
4. **Índices antes de queries.** Si una query necesita índice, crear la migración primero (ver `06-base-de-datos.md`).
5. **Tests para toda optimización.** Un test que verifica el resultado es correcto, aunque no mida performance.
6. **No usar `.select('*')` en servicios de producción** — siempre especificar campos.

## Verificación

```bash
# Verificar que los servicios optimizados siguen pasando tests
cd apps/web && npx vitest run --reporter=verbose src/features/notifications/
npx vitest run --reporter=verbose src/features/study-planner/services/
npx vitest run --reporter=verbose src/features/business-panel/services/

# Buscar patrones N+1 restantes
grep -rn "await.*supabase" apps/web/src/features/ --include="*.ts" -A 1 | \
  grep -B 1 "for.*of\|forEach" | head -20
```

## Métrica de éxito

- 0 loops con `await supabase.from()` dentro en servicios de producción
- `analytics-response.service.ts` auditado con queries paralelas donde aplique
- `adminLessons.service.ts` modularizado y N+1 corregidos
- `.select('*')` reemplazado por selects explícitos en los 10 servicios más usados
- Notificaciones usando `count: 'exact'` en vez de count en memoria
