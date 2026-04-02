# CODEX TASK — Next.js API Routes (`apps/web/src/app/api/`)

**Peso en TDI:** parte del 20% de Arquitectura
**Deuda residual estimada:** ~15%
**Fecha de corte:** 2026-04-01
**Estado:** Parcialmente resuelto — varias routes grandes modularizadas, quedan 3 hotspots activos.

---

## Lo que ya está hecho (NO tocar)

| Route | Líneas actuales | Bajó desde |
|---|---|---|
| `app/api/study-planner/calendar/events/route.ts` | 147 | 698 |
| `app/api/[orgSlug]/business/courses/[id]/route.ts` | 53 | 893 |
| `app/api/courses/[slug]/full/route.ts` | agregada | — |
| `app/api/admin/communities/slug/[slug]/detail/route.ts` | nueva | — |
| `app/api/instructor/communities/slug/[slug]/detail/route.ts` | nueva | — |
| `app/api/tts/route.ts` | nueva | — |
| `app/api/study-planner/dashboard/chat/route.ts` | 407 | 1,105 |

---

## Pendiente — ordenado por impacto

### BLOQUE 1 — Route más grande activa

**TAREA 1A — `app/api/ai-chat/route.ts` (577 líneas)**

Esta es la route más grande del sistema activo. Maneja el chat de SofLIA con:
- Detección de idioma
- Construcción de contexto (curso, planner, dashboard)
- Llamada a OpenAI
- Sanitización de respuesta
- Analytics post-respuesta
- Validación de calendario

El sistema-prompt ya fue extraído (`system-prompt.service.ts` = 51 líneas ✅).
Lo que falta es reducir la route en sí.

Separación esperada:
```
app/api/ai-chat/
├── route.ts                            # ≤150 líneas — solo orchestration
├── services/
│   ├── request-normalization.service.ts   # ya existe ✅
│   ├── language-detection.service.ts      # ya existe ✅
│   ├── help-instructions.service.ts       # ya existe ✅
│   ├── analytics-setup.service.ts         # ya existe ✅
│   ├── response-sanitizer.service.ts      # ya existe ✅
│   ├── calendar-validation.service.ts     # ya existe ✅
│   ├── study-schedule.service.ts          # ya existe ✅
│   ├── chat-context-builder.service.ts    # NUEVO — construye el contexto completo
│   └── openai-request.service.ts          # NUEVO — encapsula llamada a OpenAI
└── __tests__/
    ├── system-prompt.service.test.ts      # ya existe ✅
    ├── chat-context-builder.service.test.ts  # NUEVO
    └── openai-request.service.test.ts        # NUEVO
```

Lo que debe quedar en `route.ts` (≤150 líneas):
```typescript
// 1. Validar request (Zod)
// 2. Construir contexto via chat-context-builder.service
// 3. Llamar OpenAI via openai-request.service
// 4. Sanitizar respuesta
// 5. Registrar analytics
// 6. Retornar respuesta
```

**TAREA 1B — `app/api/[orgSlug]/business/reports/data/route.ts`**

No está en el hotspot table pero es un candidato conocido por queries pesadas.
Verificar líneas actuales antes de atacar:
```bash
wc -l apps/web/src/app/api/\\[orgSlug\\]/business/reports/data/route.ts
```
Si >400 líneas: extraer query builders a `reports-data-query.service.ts`.

---

### BLOQUE 2 — Validación Zod sistemática

La mayoría de las routes NO tienen validación Zod del request body.
Actualmente solo `app/api/tts/route.ts` tiene Zod completo.

**TAREA 2A — Agregar validación Zod a routes de alto riesgo:**

```typescript
// Patrón a seguir (igual que TTS):
import { z } from 'zod'

const RequestSchema = z.object({
  // campos tipados
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  // usar parsed.data con tipos seguros
}
```

Routes prioritarias para agregar Zod:
1. `app/api/ai-chat/route.ts`
2. `app/api/study-planner/dashboard/chat/route.ts`
3. `app/api/[orgSlug]/business/analytics/route.ts`
4. `app/api/[orgSlug]/business/reports/data/route.ts`

---

### BLOQUE 3 — Rate limiting sistemático

Actualmente solo `/api/tts` tiene rate limiting. Endpoints que lo necesitan:

| Route | Riesgo sin rate limit |
|---|---|
| `app/api/ai-chat/route.ts` | Alto — cada request llama a OpenAI (costo real) |
| `app/api/study-planner/dashboard/chat/route.ts` | Alto — misma razón |
| `app/api/tts/route.ts` | Ya tiene ✅ |

**TAREA 3A — Centralizar rate limiter:**

```typescript
// app/api/_lib/rate-limit.ts
// Reutilizar el patrón de app/api/tts/route.ts
// Exportar función configurable: rateLimit({ max: 10, windowMs: 60_000 })
```

Aplicar a:
- `app/api/ai-chat/route.ts`: max 20 requests/minuto por userId
- `app/api/study-planner/dashboard/chat/route.ts`: max 30 requests/minuto

---

### BLOQUE 4 — Endpoints agregados faltantes

El programa eliminó N+1 en varios dominios creando endpoints de detalle agregados.
Quedan dominios sin endpoint agregado:

**TAREA 4A — `app/api/[orgSlug]/business-user/dashboard/route.ts` (si no existe)**

Verificar si el dashboard del business user aún hace múltiples fetches cliente.
Si sí: crear endpoint agregado que retorne `{ org, stats, courses, recentActivity }` en 1 call.

**TAREA 4B — Endpoint de perfil instructor agregado**
Verificar `app/api/instructor/` — si hay rutas separadas para stats/cursos/comunidades
que podrían consolidarse.

---

## Reglas para Codex en este módulo

1. **Route handlers ≤150 líneas.** La route solo orquesta — no tiene lógica de negocio inline.
2. **Toda route nueva debe tener Zod** en el request body.
3. **Toda route que llame OpenAI o ElevenLabs debe tener rate limiting.**
4. **Services en `route-name/services/`** — nunca lógica inline en la route.
5. **`NextResponse.json()` con tipo explícito** en todas las respuestas de error.
6. **Sin Supabase client en la route directamente.** Usar service layer.
7. **Sin `any` en types de request/response.**

## Verificación

```bash
# Tests focalizados por route
npx vitest run --reporter=verbose apps/web/src/app/api/ai-chat/__tests__/
npx vitest run --reporter=verbose apps/web/src/app/api/study-planner/

# Verificar que ninguna route supera 150 líneas
find apps/web/src/app/api -name "route.ts" | xargs wc -l | sort -rn | head -10
```

## Métrica de éxito

- `app/api/ai-chat/route.ts` ≤ 150 líneas
- Todas las routes de OpenAI/ElevenLabs con rate limiting
- ≥5 routes con validación Zod activa
- 0 routes con lógica de negocio inline >50 líneas
