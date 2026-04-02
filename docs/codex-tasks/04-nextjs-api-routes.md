# CODEX TASK - Next.js API Routes (`apps/web/src/app/api/`)

**Peso en TDI:** parte del 20% de Arquitectura
**Deuda residual actual:** ~9%
**Fecha de corte:** 2026-04-02 (worktree real)

---

## Ya resuelto - NO tocar

| Route | Lineas actuales | Bajo desde | Estado |
|---|---|---|---|
| `app/api/ai-chat/route.ts` | 155 | 746 | ok |
| `app/api/study-planner/dashboard/chat/route.ts` | 148 | 1,105 | ok |
| `app/api/study-planner/calendar/sync-sessions/route.ts` | 106 | 627 | ok |
| `app/api/study-planner/calendar/events/route.ts` | 147 | 698 | ok |
| `app/api/[orgSlug]/business/courses/[id]/route.ts` | 53 | 893 | ok |
| `app/api/courses/[slug]/lessons/[lessonId]/progress/route.ts` | **90** | 666 | ok + validacion estricta + tests |
| `app/api/courses/[slug]/learn-data/route.ts` | **52** | 633 | ok + query/response services + tests |
| `app/api/tts/route.ts` | - | - | ok Zod + rate limit |

### Rate limiting implementado

- `app/api/ai-chat/route.ts`
- `app/api/study-planner/dashboard/chat/route.ts`
- `app/api/tts/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/me/route.ts`
- `app/api/auth/refresh/route.ts`
- `app/api/auth/sessions/route.ts`
- `app/api/auth/questionnaire-status/route.ts`

---

## Pendiente - ordenado por impacto

### BLOQUE 1 - Route grande activa

**TAREA 1A - `app/api/study-planner/events/[id]/route.ts` (617 lineas)**

Hotspot activo del modulo. Debe quedar como wrapper fino:

```
app/api/study-planner/events/[id]/
|-- route.ts                         # <=80 lineas
|-- services/
|   |-- events-id-query.service.ts
|   |-- events-id-mutation.service.ts
|   `-- __tests__/
```

### BLOQUE 2 - Validacion sistematica

Las routes mas sensibles que siguen sin validacion consistente deben quedar con parsing estricto:

1. `app/api/[orgSlug]/business/analytics/route.ts`
2. `app/api/[orgSlug]/business/reports/data/route.ts`
3. `app/api/study-planner/sessions/route.ts`
4. `app/api/study-planner/sessions/update/route.ts`
5. `app/api/study-planner/events/[id]/route.ts`

### BLOQUE 3 - Controllers con logica inline

**TAREA 3A - `app/[orgSlug]/business-panel/courses/page.tsx` (611 lineas)**

Debe quedar como controller fino:

```
app/[orgSlug]/business-panel/courses/
|-- page.tsx                         # <=80 lineas
|-- components/
|-- hooks/
`-- services/
```

### BLOQUE 4 - Endpoints sin rate limiting

| Route | Riesgo | Limite sugerido |
|---|---|---|
| `app/api/study-planner/sessions/route.ts` | Medio | 60 req/min |
| `app/api/study-planner/calendar/events/route.ts` | Medio | 30 req/min |
| `app/api/[orgSlug]/business/*/route.ts` | Bajo | 100 req/min |

---

## Reglas para Codex en este modulo

1. Route handlers <=150 lineas. La route solo orquesta.
2. Toda route nueva o saneada debe validar request input.
3. Toda route que llame OpenAI o ElevenLabs debe tener rate limiting.
4. Services en `route-name/services/`.
5. `NextResponse.json()` con respuestas de error tipadas.
6. Sin logica de negocio pesada inline en la route.
7. Sin `any` en request/response si se puede evitar.

## Verificacion

```bash
cd apps/web
npx vitest run --reporter=verbose src/app/api/courses/

find apps/web/src/app/api -name "route.ts" | xargs wc -l | sort -rn | head -10

wc -l "apps/web/src/app/api/study-planner/events/[id]/route.ts"
```

## Metrica de exito

- `progress/route.ts` <= 100 lineas ok
- `learn-data/route.ts` <= 80 lineas ok
- `study-planner/events/[id]/route.ts` <= 80 lineas
- >=8 routes con validacion estricta activa
- 0 routes con logica de negocio inline >50 lineas
- `business-panel/courses/page.tsx` <= 80 lineas
