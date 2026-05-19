# Codex — Migración de rutas API a `withZodBody` (152 rutas restantes)

> **Audiencia**: Codex (u otra IA) ejecutando migraciones en paralelo.
> **Estado base**: ~55 rutas migradas en sesiones previas. **Quedan 152 rutas en 146 archivos** con `await request.json()`.
> **Meta**: 0 `await request.json()` en `apps/web/src/app/api/**`.
> **Patrón canónico**: [docs/tech-debt/route-migration-pattern.md](docs/tech-debt/route-migration-pattern.md).
> **Ejemplo de schemas compartidos**: [apps/web/src/app/api/business/hierarchy/_schemas.ts](apps/web/src/app/api/business/hierarchy/_schemas.ts) (16 schemas reutilizables como referencia).

---

## Cómo usar este archivo

1. Cada **lote** `R#` es asignable a un agente independiente.
2. Para asignar a un agente, pega esto al inicio del chat:

```text
Lee CLAUDE.md, CLAUDE.local.md, prompt_maestro.md,
docs/tech-debt/route-migration-pattern.md y
apps/web/src/app/api/business/hierarchy/_schemas.ts (como referencia).

Ejecuta el LOTE {{R#}} de CODEX_ROUTE_MIGRATION_TASKS.md.

Reporta solo el resumen final.
```

3. Los lotes son **paralelos seguros** entre sí: cada agente toca un dominio distinto.

---

## Pre-autorizaciones (NO preguntes, hazlo)

- `npm install --save-dev` para deps que tu lote necesite explícitamente.
- Crear `schema.ts` y `_schemas.ts` donde haga falta dentro de tu scope.
- Crear `__tests__/schema.test.ts` para schemas no triviales.
- Hacer commits y abrir PR contra la rama actual.
- Usar `git add` solo de los archivos de tu scope (NUNCA `git add .`).

---

## Reglas absolutas (violarlas = PR rechazado)

1. **NO** introduzcas `any`, `console.*`, hex colors hardcoded, `select('*')`, `@ts-ignore`, `eslint-disable` sin justificación documentada.
2. **NO** modifiques archivos fuera de tu scope. Si necesitas un schema compartido (ej. `_schemas.ts` ya existente), úsalo importando, no lo edites a menos que añadas un nuevo schema.
3. **NO** cambies la lógica de negocio. Solo refactor mecánico: validación + envelope de error.
4. **NO** uses `--no-verify`, `--no-gpg-sign` ni skip hooks.
5. **NO** rompas tests existentes. Si rompiste alguno, arréglalo o repórtalo.
6. **SIEMPRE** reemplaza `NextResponse.json({ error: '...' }, { status: N })` por `apiError(code, message, status)`.
7. **SIEMPRE** preserva GET y DELETE handlers — solo migra POST/PUT/PATCH.
8. **SIEMPRE** mantén la firma `(request, body, context)` en el handler interno.

---

## Patrón canónico (resumen)

```ts
// 1. ./schema.ts (o usar _schemas.ts compartido)
import { z } from 'zod';

export const myInputSchema = z.object({
  field: z.string().min(1).max(200),
});
export type MyInputBody = z.infer<typeof myInputSchema>;

// 2. ./route.ts
import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { requireBusiness } from '@/lib/auth/requireBusiness'; // o requireAdmin / requireUser
import { myInputSchema, type MyInputBody } from './schema';

type RouteContext = { params: Promise<{ id: string }> };

async function handlePost(
  _request: NextRequest,
  body: MyInputBody,
  context: RouteContext,
) {
  const auth = await requireBusiness();
  if (auth instanceof NextResponse) return auth;

  // ... lógica original sin parseo manual
  try {
    // ...
    return NextResponse.json({ success: true, /* ... */ });
  } catch (error) {
    return apiError('OPERATION_FAILED', 'Mensaje seguro', 500);
  }
}

export const POST = withZodBody(myInputSchema, handlePost);
```

Para rutas que necesitan **auth + body validation**, ver `apps/web/src/app/api/auth/mfa/activate/route.ts` como ejemplo de composición manual con `withAuth`.

---

## 🟢 R1 — `/api/[orgSlug]/business/hierarchy/*` (17 rutas) — **EL MÁS FÁCIL**

> Espejo casi exacto de `/api/business/hierarchy/*` que ya está migrado. Reusa los mismos schemas.

**Scope**: `apps/web/src/app/api/[orgSlug]/business/hierarchy/**/*.ts`

**Listar pendientes**:
```bash
grep -rl "await request\.json()\|await req\.json()" "apps/web/src/app/api/[orgSlug]/business/hierarchy"
```

**Schemas a usar**: importar desde `@/app/api/business/hierarchy/_schemas` (relativo: `../../../../business/hierarchy/_schemas`).

```ts
import {
  createRegionSchema, updateRegionSchema,
  createZoneSchema, updateZoneSchema,
  createTeamSchema, updateTeamSchema,
  createNodeSchema, updateNodeSchema,
  moveNodeSchema, nodeMemberAssignmentSchema,
  geocodeSchema, updateHierarchyConfigSchema,
  createStructureSchema, assignUsersSchema,
  assignCoursesSchema, updateCourseAssignmentSchema,
  chatMessageSchema, chatMessageEditSchema,
  chatReadSchema,
} from '@/app/api/business/hierarchy/_schemas';
```

**Rutas en el lote**:
- `regions/route.ts`, `regions/[regionId]/route.ts`
- `zones/route.ts`, `zones/[zoneId]/route.ts`
- `teams/route.ts`, `teams/[teamId]/route.ts`
- `nodes/route.post.ts`, `nodes/[nodeId]/route.ts`, `nodes/[nodeId]/move/route.ts`, `nodes/[nodeId]/members/route.ts`
- `geocode/route.ts`
- `config/route.put.ts`
- `structures/route.post.ts`
- `users/assign/route.ts`
- `courses/assign/route.ts`, `courses/assignments/route.ts` (si existe)
- `chats/route.ts`, `chats/[chatId]/read/route.ts`, `chats/[chatId]/messages/route.ts`, `chats/[chatId]/messages/[messageId]/route.put.ts`

**Referencia**: el ya migrado `apps/web/src/app/api/business/hierarchy/regions/route.ts` y los demás del mismo árbol.

**Criterio**:
- [ ] 0 `await request.json()` en tu scope.
- [ ] Todos usan `withZodBody` + `apiError`.
- [ ] `requireBusiness()` aplicado y `auth.organizationId` validado contra el `orgSlug` del path.
- [ ] PR único con ≤300 LOC de cambios efectivos.

---

## 🟢 R2 — `/api/[orgSlug]/business/*` resto (17 rutas)

**Scope**: `apps/web/src/app/api/[orgSlug]/business/**/*.ts` **excepto** `hierarchy/*`.

**Listar pendientes**:
```bash
grep -rl "await request\.json()\|await req\.json()" "apps/web/src/app/api/[orgSlug]/business" | grep -v hierarchy
```

**Rutas en el lote**:
- `branding/route.put.ts`
- `certificates/templates/route.ts` (POST + PUT, 2 endpoints)
- `courses/[id]/assign/route.ts` (POST + PUT, 2 endpoints)
- `dashboard/layout/route.ts`
- `intro-videos/course/[courseId]/route.put.ts`
- `intro-videos/learning-path/[lpId]/route.put.ts`
- `intro-videos/upload-url/route.ts`
- `join-requests/[id]/route.ts`
- `learning-paths/assignments/route.ts`
- `learning-paths/defaults/apply/route.ts`
- `learning-paths/defaults/route.post.ts`
- `notifications/settings/route.ts`
- `reports-analytics/insights/route.ts`
- `reports-analytics/route.ts`
- `settings/organization/route.put.ts`
- `settings/route.ts`
- `settings/subscription/change-plan/route.ts`
- `settings/subscription/route.put.ts`
- `styles/route.ts` (GET + PUT, 2 endpoints)
- `subscription/change-plan/route.ts`
- `teams/route.ts`
- `users/[userId]/route.ts`
- `users/route.ts`

**Acción**: Crear schemas locales `./schema.ts` en cada ruta. Para settings/branding/styles puedes crear un `_schemas.ts` compartido en `[orgSlug]/business/settings/` y `[orgSlug]/business/`.

**Criterio**: 0 `await request.json()` en tu scope.

---

## 🟢 R3 — `/api/business/*` resto (9 rutas)

**Scope**: `apps/web/src/app/api/business/**/*.ts` **excepto** `hierarchy/*` y `users/*` (ya migrados).

**Listar pendientes**:
```bash
grep -rl "await request\.json()\|await req\.json()" apps/web/src/app/api/business | grep -v hierarchy | grep -v "users/"
```

**Rutas en el lote**:
- `business/certificates/templates/route.ts` (POST + PUT)
- `business/courses/[id]/assign/route.ts`
- `business/dashboard/layout/route.ts`
- `business/join-requests/[id]/route.ts`
- `business/notifications/settings/route.ts`
- `business/settings/branding/route.ts`
- `business/settings/organization/route.ts`
- `business/settings/route.ts`
- `business/settings/styles/route.ts` (POST + PUT)
- `business/settings/subscription/change-plan/route.ts`
- `business/settings/subscription/route.ts`
- `business/user-groups/[id]/members/route.ts`
- `business/user-groups/[id]/members/[memberId]/route.put.ts`

**Reuso**: Si tu trabajo coincide con esquemas creados en R2 (`/api/[orgSlug]/business/`), considera factorizar a un schema compartido en `apps/web/src/app/api/_schemas/business-*.schema.ts`.

---

## 🟡 R4 — `/api/study-planner/*` (22 rutas)

**Scope**: `apps/web/src/app/api/study-planner/**/*.ts`

**Listar pendientes**:
```bash
grep -rl "await request\.json()\|await req\.json()" apps/web/src/app/api/study-planner
```

**Rutas en el lote**:
- `calculate-availability/route.ts`
- `calendar/analyze/route.ts`
- `calendar/connect/route.post.ts`
- `calendar/delete-plan-events/route.ts`
- `calendar/disconnect/route.ts`
- `calendar/insert-events/route.ts`
- `calendar/selection/route.ts`
- `calendar/sync-sessions/route.ts`
- `dashboard/actions/route.ts`
- `dashboard/chat/confirm/route.ts`
- `dashboard/chat/route.ts`
- `events/route.ts`, `events/[id]/route.ts`
- `generate-plan/route.ts`
- `lesson-tracking/complete/route.ts`, `lesson-tracking/event/route.ts`, `lesson-tracking/start/route.ts`
- `plan/apply-patch/route.ts`, `plan/route.ts`
- `save-plan/route.ts`
- `sessions/update/route.ts`
- `suggest-learning-route/route.ts`
- `validate-session-times/route.ts`

**Crear**: `apps/web/src/app/api/study-planner/_schemas.ts` con schemas compartidos para sesiones, calendar events, plan operations, lesson-tracking events.

**Atención especial**: `dashboard/chat/route.ts` envía prompts a Gemini. Mantener `prompt-injection-detector` ya existente. NO sanitizar el input antes de la validación de Zod (queremos preservar el texto exacto).

---

## 🟡 R5 — `/api/courses/[slug]/*` (16 rutas)

**Scope**: `apps/web/src/app/api/courses/[slug]/**/*.ts`

**Listar pendientes**:
```bash
grep -rl "await request\.json()\|await req\.json()" "apps/web/src/app/api/courses/[slug]"
```

**Rutas en el lote**:
- `intro-videos/watched/route.ts`
- `lessons/[lessonId]/activities/[activityId]/dialogue/message/route.ts`
- `lessons/[lessonId]/activities/[activityId]/submission/route.post.ts`
- `lessons/[lessonId]/activities/[activityId]/validate/route.ts`
- `lessons/[lessonId]/feedback/route.post.ts`
- `lessons/[lessonId]/notes/route.post.ts`, `lessons/[lessonId]/notes/[noteId]/route.put.ts`
- `lessons/[lessonId]/quiz/submit/route.ts`
- `questions/route.ts`, `questions/[questionId]/route.ts`, `questions/[questionId]/reactions/route.ts`
- `questions/[questionId]/responses/route.ts`, `responses/[responseId]/route.ts`, `responses/[responseId]/reactions/route.ts`
- `skills/route.ts`

**Crear**: `apps/web/src/app/api/courses/_schemas.ts` con schemas para questions/responses/reactions, notes, quiz submission, activity submission/validate.

**Atención**: `quiz/submit`, `activities/[id]/validate`, `activities/[id]/submission` reciben input que puede llegar al LLM. Combinar con `sanitizeHtml` de `@/lib/security/sanitize-html` solo en campos HTML libres.

---

## 🟡 R6 — `/api/lia/*` (11 rutas)

**Scope**: `apps/web/src/app/api/lia/**/*.ts`

**Listar pendientes**:
```bash
grep -rl "await request\.json()\|await req\.json()" apps/web/src/app/api/lia
```

**Rutas en el lote**:
- `chat/route.ts`
- `complete-activity/route.ts`, `end-conversation/route.ts`
- `conversations/route.ts`, `conversations/[conversationId]/route.ts`
- `lesson-suggestions/route.ts`
- `onboarding-chat/route.ts`
- `personalization/personalization.post.ts`
- `start-activity/route.ts`, `update-activity/route.ts`

**Crear**: `apps/web/src/app/api/lia/_schemas.ts`.

**Atención**: `chat/route.ts` y `onboarding-chat` envían prompts a OpenAI. Schemas permisivos en content (max 50_000 chars). Mantener el detector de prompt injection existente.

---

## 🟡 R7 — `/api/communities/[slug]/*` resto (7 rutas)

**Scope**: `apps/web/src/app/api/communities/**/*.ts` **excepto** `join` y `request-access` (ya migrados).

**Listar pendientes**:
```bash
grep -rl "await request\.json()\|await req\.json()" "apps/web/src/app/api/communities" | grep -v "/join/" | grep -v "/request-access/"
```

**Rutas en el lote**:
- `[slug]/polls/[postId]/vote/route.ts`
- `[slug]/posts/route.post.ts`, `[slug]/posts/[postId]/route.ts`
- `[slug]/posts/[postId]/comments/comments.post.ts`
- `[slug]/posts/[postId]/hide/route.ts`, `[slug]/posts/[postId]/reactions/route.ts`, `[slug]/posts/[postId]/report/route.ts`
- `[slug]/posts/reactions/batch/route.ts`
- `[slug]/reports/[reportId]/resolve/route.ts`

**Crear**: `apps/web/src/app/api/communities/_schemas.ts`.

**Atención**: posts y comments tienen content HTML. Sanitizar con `sanitizeHtml()` ANTES de persistir (NO en el schema, después del parsing).

---

## 🟡 R8 — `/api/scorm/*` + `/api/reels/*` + `/api/security/*` (11 rutas)

**Scope**: 3 dominios independientes.

**Listar pendientes**:
```bash
grep -rl "await request\.json()\|await req\.json()" apps/web/src/app/api/scorm apps/web/src/app/api/reels apps/web/src/app/api/security
```

**Rutas en el lote**:
- **scorm** (5): `packages/[id]/route.patch.ts`, `runtime/commit/route.ts`, `runtime/initialize/route.ts`, `runtime/setValue/route.ts`, `runtime/terminate/route.ts`
- **reels** (3): `[id]/route.ts`, `[id]/comments/route.post.ts`, `comments/[id]/replies/route.post.ts`
- **security** (3): `agent-handshake/route.ts`, `automation-signal/route.ts`, `csp-report/route.ts`

**Atención SCORM**: el body sigue el estándar SCORM 1.2/2004 — `cmi.*` keys polimórficas. **Usa `z.record(z.unknown())` permisivo**, NO bloquees ningún campo. Solo agrega límite de tamaño (max 100_000 chars en stringify).

**Atención CSP report**: el body es JSON estándar W3C `report-uri`. **NO cambies la shape**. Solo agrega validación mínima del tipo (z.record(z.unknown())).

---

## 🟢 R9 — Misceláneo (~22 rutas dispersas)

**Scope**: el resto del repo, archivos sueltos sin agrupación obvia.

**Listar pendientes**:
```bash
grep -rl "await request\.json()\|await req\.json()" apps/web/src/app/api \
  | grep -v "/business/hierarchy" \
  | grep -v "/\[orgSlug\]/business" \
  | grep -v "/business/" \
  | grep -v "/study-planner/" \
  | grep -v "/courses/\[slug\]/" \
  | grep -v "/lia/" \
  | grep -v "/communities/" \
  | grep -v "/scorm/" \
  | grep -v "/reels/" \
  | grep -v "/security/"
```

**Rutas en el lote**:
- `ai-chat/route.ts`, `ai-intent/route.ts`
- `auth/mfa/route.ts`, `auth/mfa/activate/route.ts`, `auth/mfa/verify/route.ts` (ya usan parseo manual con Zod — solo confirmar)
- `certificates/generate/route.ts`
- `courses/import/course-import/import-body.ts`
- `favorites/route.ts`
- `internal/jobs/failures/route.ts`, `internal/jobs/users/bulk-import/route.ts`
- `invite/[token]/route.ts`
- `lesson-tracking/update-progress/route.ts`
- `notifications/route.post.ts`
- `[orgSlug]/business-user/analytics/insights/route.ts`
- `[orgSlug]/business-user/learning-preview/route.ts`
- `questionnaire/questions/[id]/route.ts`
- `reportes/route.ts`
- `statistics/profile/route.ts`
- `study-planner-chat/route.ts`
- `tts/route.ts`
- `users/[userId]/skills/[skillId]/display/route.ts`
- `admin/courses/[id]/modules/[moduleId]/lessons/route.post.validation.ts` (helper, no route)
- `admin/translate-existing-lessons/translation/request.ts` (helper, no route)

**Atención**:
- Los 2 `helper.ts` no son rutas Next.js, solo refactor para usar Zod internamente.
- Los 3 endpoints MFA ya usan parseo manual con Zod (compatible con `withAuth`). Verificar y confirmar; no requieren cambio.
- `internal/jobs/*` son rutas internas con header secret. Mantener el header check + agregar Zod al body.

---

## Output esperado al cerrar cada lote

Cuando cierres tu lote, el PR debe tener este shape de descripción:

```markdown
## Lote R{N} — Migración Zod {dominio}

### Resumen
- Rutas migradas: N de N
- Schemas creados: N (en {paths})
- Tests de schema agregados: N

### Métricas
- `await request.json()` en mi scope: <antes> → <después>
- `NextResponse.json({ error: ... })` legacy en mi scope: <antes> → <después>

### Validación
- `npm run lint --workspace=apps/web` → 0 errores nuevos
- `npm run type-check:core --workspace=apps/web` → 0 errores nuevos (si aplica)
- `npm run test --workspace=apps/web` → tests existentes pasan

### Riesgos / notas
- (cualquier ruta que no pudiste migrar y por qué)
- (cambios de shape de respuesta — debería ser cero)
```

---

## Asignación recomendada

Si tienes 9 agentes disponibles:

| Agente | Lote | Carga | Dependencias |
|---|---|---|---|
| A1 | R1 (orgSlug hierarchy) | Baja-Media (espejo trivial) | Ninguna |
| A2 | R2 (orgSlug business resto) | Media | Ninguna |
| A3 | R3 (business resto) | Media | Coordinar schemas compartidos con A2 |
| A4 | R4 (study-planner) | Alta (22 rutas) | Ninguna |
| A5 | R5 (courses [slug]) | Media-Alta | Ninguna |
| A6 | R6 (lia) | Media | Ninguna |
| A7 | R7 (communities) | Media | Ninguna |
| A8 | R8 (scorm+reels+security) | Baja-Media | Ninguna |
| A9 | R9 (misceláneo) | Alta (22 rutas dispersas) | Ninguna |

**Si tienes solo 3-4 agentes**, agrupa así:
- Agente α: R1 + R2 + R3 (todo business)
- Agente β: R4 + R5 + R6 (study-planner + courses + lia)
- Agente γ: R7 + R8 + R9 (communities + scorm + reels + security + misc)

---

## Estado de cierre esperado

| Métrica | Hoy | Tras estos lotes | Meta |
|---|---:|---:|---:|
| `await request.json()` en `/api/*` | 152 | **0** ✅ | 0 |
| Rutas con `withZodBody` | ~60 | **~210+** | 100 % mutadoras |
| Schemas en `app/api/*` (centralizados o locales) | ~50 | **~130+** | suficiente cobertura |
| Deuda técnica total | ~8.5 % | **~5 %** | ≤5 % |
| Salud total | ~91.5 | **~95** | ≥95 |

**Cuando se cierre R1-R9, la Tarea 1.4 estará COMPLETA al 100 %** y la deuda técnica global cerrará por debajo de la meta original.

---

## Coordinación final

Tras cerrar todos los lotes:

1. Actualizar [docs/tech-debt/progress.md](docs/tech-debt/progress.md) con métricas finales.
2. Promover en [apps/web/.eslintrc.*](apps/web/.eslintrc.mjs) la regla custom `no-restricted-syntax` para bloquear `await request.json()` directo en `app/api/**/route.ts` futuras.
3. Actualizar [TECH_DEBT_REMEDIATION.md](TECH_DEBT_REMEDIATION.md) marcando 1.4 como `[x]` cerrada.
4. Crear un único PR de cierre que actualice los docs y archive este archivo (mover a `docs/tech-debt/historical/route-migration-tasks-completed.md`).
