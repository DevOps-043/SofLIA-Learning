# CODEX TASK — Optimización de Queries y Performance

**Peso en TDI:** parte del 10% de BD + parte del 20% de Arquitectura
**Deuda residual estimada:** sin medición formal — múltiples N+1 identificados
**Fecha de corte:** 2026-04-01
**Estado:** Parcialmente resuelto — varios N+1 eliminados, pero hotspots de performance
en business panel y study planner siguen activos.

---

## Lo que ya está hecho (NO tocar)

- `adminCommunityContent.service.ts` — N+1 de comentarios/reacciones eliminado con bulk + mapa por `user_id` ✅
- `app/api/courses/[slug]/full/route.ts` — pasó de múltiples queries a 1 payload agregado ✅
- `app/api/[orgSlug]/business/analytics/route.ts` — full scan de `study_sessions` eliminado ✅
- `analytics-identity.service.ts` — matching email/UUID en mapa O(n), no O(n²) ✅
- `adminCommunityMembers.service.ts` — `find()` sobre arrays reemplazado por mapas ✅
- `useCommunityDetail.ts` — pasó de 5 fetches cliente a 1 endpoint agregado ✅
- `profile-server.service.ts` — stats en `Promise.all`, short-circuit si no hay cambios ✅
- `app/[orgSlug]/business-user/dashboard/page.tsx` — carga de org + dashboard en `Promise.all` ✅

---

## Pendiente — por impacto de performance

### BLOQUE 1 — N+1 probables sin confirmar

**TAREA 1A — Auditar `features/business-panel/services/businessUsers.server.service.ts` (635 líneas)**

Este es el servicio más grande sin modularizar del business panel. Los servicios de usuarios
B2B frecuentemente tienen N+1 por usuario.

```bash
# Leer el archivo completo
cat apps/web/src/features/business-panel/services/businessUsers.server.service.ts
```

Buscar patrones problemáticos:
```typescript
// ❌ N+1 clásico
for (const user of users) {
  const stats = await supabase.from('user_stats').select('*').eq('user_id', user.id)
}

// ✅ Corrección: bulk fetch + agrupado por mapa
const userIds = users.map(u => u.id)
const { data: allStats } = await supabase.from('user_stats').select('*').in('user_id', userIds)
const statsByUser = Object.fromEntries(allStats.map(s => [s.user_id, s]))
```

**TAREA 1B — Auditar `features/study-planner/services/course-analysis.service.ts` (668 líneas)**

El análisis de cursos para el planner puede hacer queries repetidas por lección/módulo.

Buscar en el archivo:
1. Loops con `await supabase.from(...)` dentro — cada uno es un N+1
2. Múltiples llamadas a Supabase que podrían fusionarse con `.select('*, modulos(*, lecciones(*))')`
3. Transformaciones sobre arrays completos con `.find()` — reemplazar con mapas

**TAREA 1C — Auditar `features/business-panel/services/analytics/analytics-response.service.ts` (694 líneas)**

Este servicio tiene lógica de agregación compleja. Verificar:
1. ¿Hace queries dentro de loops por usuario/equipo?
2. ¿Filtra en memoria arrays grandes que deberían filtrarse en SQL?
3. ¿Hace múltiples `.count()` que podrían ser un solo query con `GROUP BY`?

---

### BLOQUE 2 — Queries de alto volumen sin optimizar

**TAREA 2A — Notificaciones: query de conteo de no-leídas**

La query de `getUnreadCount` probablemente hace un `SELECT *` con count en memoria.

Corrección esperada:
```typescript
// ❌ Ineficiente
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .eq('status', 'unread')
// count = data.length en memoria

// ✅ Eficiente — count en DB
const { count } = await supabase
  .from('notifications')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('status', 'unread')
```

Verificar en `features/notifications/services/notification/query.service.ts`.

**TAREA 2B — Study Sessions: queries de rangos de fecha**

El planner hace múltiples queries de sesiones por rango de fecha. Verificar si usan
índices (ver `06-base-de-datos.md` TAREA 4A).

```bash
# Buscar queries de study_sessions en el planner
grep -r "study_sessions" apps/web/src/features/study-planner/services/ --include="*.ts" -l
```

Para cada servicio: verificar que las queries filtran por `user_id` primero, luego por fecha.
El orden de columnas en el `WHERE` afecta el uso del índice.

---

### BLOQUE 3 — Carga inicial de páginas con múltiples fetches

**TAREA 3A — Auditar pages del business panel**

Verificar si estas páginas aún hacen múltiples fetches paralelos no coordinados:

```bash
grep -r "useEffect\|fetch(" apps/web/src/app/\\[orgSlug\\]/business-panel/ \
  --include="*.tsx" -l
```

Para cada página con múltiples fetches: consolidar en `Promise.all` dentro de un hook
o migrar a endpoint agregado en `app/api/`.

**TAREA 3B — `app/api/[orgSlug]/business/analytics/route.ts`**

Verificar el estado actual post-refactorización:
```bash
wc -l apps/web/src/app/api/\\[orgSlug\\]/business/analytics/route.ts
```

Si el servicio de agregación hace queries secuenciales por métrica, paralelizarlas:
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

### BLOQUE 4 — Caché de respuestas

**TAREA 4A — Caché en endpoints de datos estables**

Algunos datos cambian poco y pueden cachearse con los mecanismos de Next.js:

```typescript
// Para datos que cambian poco (cursos públicos, catálogo)
export const revalidate = 3600 // 1 hora

// Para datos de usuario (no cachear)
export const dynamic = 'force-dynamic'
```

Candidatos para caché:
1. `app/api/courses/[slug]/full/route.ts` — detalle de curso público (revalidate: 300)
2. `app/api/[orgSlug]/business/reports/data/route.ts` — reportes (revalidate: 900)

**NO cachear:**
- Cualquier route que lea datos de usuario específico
- Notificaciones
- Sesiones del planner
- Progreso de lecciones

---

### BLOQUE 5 — Selects innecesariamente amplios

**TAREA 5A — Auditar `.select('*')` en queries de producción**

Un `.select('*')` en tablas grandes trae todas las columnas aunque solo se necesiten 3.

```bash
# Buscar selects amplios en servicios
grep -rn "\.select\('\*'\)" apps/web/src/features/ --include="*.ts" | head -30
```

Para cada ocurrencia: identificar qué campos usa realmente el código y hacer el select explícito.

Ejemplo:
```typescript
// ❌ Trae 20 columnas para usar 3
const { data } = await supabase.from('usuarios').select('*').eq('id', userId)

// ✅ Solo lo necesario
const { data } = await supabase
  .from('usuarios')
  .select('id, email, first_name, last_name, role')
  .eq('id', userId)
```

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
npx vitest run --reporter=verbose apps/web/src/features/notifications/
npx vitest run --reporter=verbose apps/web/src/features/study-planner/services/
npx vitest run --reporter=verbose apps/web/src/features/business-panel/services/

# Buscar patrones N+1 restantes
grep -rn "await.*supabase" apps/web/src/features/ --include="*.ts" -A 2 | grep -B 2 "for.*of\|forEach"
```

## Métrica de éxito

- 0 loops con `await supabase.from()` dentro en servicios de producción
- `businessUsers.server.service.ts` auditado y N+1 corregidos
- `analytics-response.service.ts` con queries paralelas donde aplique
- `.select('*')` reemplazado por selects explícitos en los 10 servicios más usados
- Notificaciones usando `count: 'exact'` en vez de count en memoria
