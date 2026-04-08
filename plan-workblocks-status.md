# Estado de Implementación: Work Blocks en Planificador

## Implementado ✅

### Paso 1 — Vocabulario multilingüe PT
- `calendar-availability.service.ts`: `WORK_BLOCK_TITLE_PATTERN` agrega `servi[çc]o|expediente` (PT)
- `calendar-availability.service.ts`: `WORK_BLOCK_EXCLUDE_PATTERN` agrega `reuni[aã]o|chamada` (PT)
- `planner-chat-request.service.ts`: mismos patrones sincronizados (copia espejo client-side)

### Paso 2+4 — Derivar y pasar endTime del bloque laboral
- `planner-chat-request.service.ts`: nueva función `deriveCalendarEndTimesByDay()` — igual a la de start, pero toma el `.end/.endTime` más tardío del día
- `planner-chat-request.service.ts`: `buildDeterministicPlanContext()` ahora computa `calendarEndTimesByDay` y lo incluye en el POST body a `/api/study-planner/generate-plan`

### Paso 3 — Limitar slots al bloque laboral en `generate-plan/route.ts`
- Interfaz `Preferences` extendida con `calendarEndTimesByDay?: Record<string, string>`
- `generateTimeSlots()`: firma actualizada a incluir `workBlockEndTime?: string` en cada slot
- Slots con `calendarEndTime`: se saltan si quedan < 15 min antes del cierre del bloque
- Loop de asignación: hora de fin de sesión se "clampa" al fin del bloque laboral (LFT compliance)

### Paso 5 — Tests PT
- `__tests__/calendar-availability.service.test.ts`: 4 nuevos tests
  - `"Serviço" 8h` → true
  - `"expediente" 9h` → true
  - `"Reunião de trabalho" 9h` → false (excluido por `reuni[aã]o`)
  - `"Chamada de serviço" 9h` → false (excluido por `chamada`)

## Pendiente ⏳

### Verificación de type-check
- Comando: `cd apps/web && npx tsc --noEmit`
- Se inició pero no completó. Verificar que no haya errores en los 4 archivos modificados.

### Archivos modificados
1. `apps/web/src/features/study-planner/services/calendar-availability.service.ts`
2. `apps/web/src/features/study-planner/services/planner-chat-request.service.ts`
3. `apps/web/src/app/api/study-planner/generate-plan/route.ts`
4. `apps/web/src/features/study-planner/services/__tests__/calendar-availability.service.test.ts`

### Prueba manual sugerida
1. Conectar Google Calendar con evento "Trabajo" de 09:00-18:00 un día
2. Agregar junta de 12:00-13:00 ese mismo día
3. Pedir plan → sesiones deben aparecer entre 09:00 y 18:00, nunca fuera
4. Sin evento "Trabajo" → comportamiento Case B (08:00-20:00, igual que antes)

### Riesgo residual identificado
- `calculateValidAlternatives()` en route.ts llama a `generateDeterministicPlan()` con las mismas preferencias originales. Si el usuario no tenía `calendarEndTimesByDay` en las alternativas también, las alternativas podrían generar slots fuera del bloque. Bajo impacto (solo afecta el cálculo de alternativas cuando se excede deadline), pero anotado para siguiente iteración.
