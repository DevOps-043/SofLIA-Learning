# Patrón de migración a `withZodBody` — Tarea 1.4

Patrón obligatorio para migrar las ~200 rutas restantes con `await request.json()`.

## Patrón canónico

### 1. Schema en archivo separado (`schema.ts` junto al `route.ts`)

```ts
import { z } from 'zod';

export const myInputSchema = z.object({
  field: z.string().min(1).max(200),
  // ... otros campos
});

export type MyInput = z.infer<typeof myInputSchema>;
```

### 2. Handler refactorizado en `route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { withZodBody } from '@/lib/api/with-validation';
import { apiError } from '@/lib/api/errors';
import { myInputSchema, type MyInput } from './schema';

async function handlePost(_request: NextRequest, body: MyInput, context: RouteContext) {
  try {
    // ... lógica original (sin parseo manual)
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError('OPERATION_FAILED', 'Mensaje seguro al cliente.', 500);
  }
}

export const POST = withZodBody(myInputSchema, handlePost);
```

### 3. Reglas obligatorias

- Schema en `./schema.ts` (NO inline en route.ts).
- Body strings: `.min(1).max(N)` siempre — evita payloads vacíos y oversized.
- UUIDs: `z.string().uuid()`.
- Emails: `z.string().email().toLowerCase()`.
- Enums: `z.enum(['A', 'B', 'C'])`.
- Tokens: regex restrictiva (alfanumérico mayúsculas, longitud fija).
- Sanitizar HTML: combinar con `sanitizeHtml()` ANTES de la validación si el campo lo requiere.
- Reemplazar TODAS las `NextResponse.json({ error: ... }, { status: ... })` por `apiError(code, message, status)`.
- Mantener el handler interno con misma firma; no cambiar la lógica de negocio.
- Si el handler necesitaba `auth`, componer con `withAuth(withZodBody(schema, handler))` o duplicar el wrapper.

## Composición con `withAuth`

Para rutas autenticadas con validación de body:

```ts
import { withAuth } from '@/lib/api/with-auth';

export const POST = withAuth(
  async (request, auth) => {
    // Parseo + validación manual (withZodBody no compone trivialmente con withAuth)
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return apiError('INVALID_JSON', '...', 400);
    }
    const parsed = myInputSchema.safeParse(json);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', '...', 422, { details: parsed.error.flatten() });
    }
    // ... usar parsed.data + auth.userId
  },
  { roles: ['Admin', 'Business'] },
);
```

Ver ejemplo: `apps/web/src/app/api/auth/mfa/activate/route.ts`.

## Rutas ya migradas (referencias)

| Ruta | Patrón aplicado |
|---|---|
| `apps/web/src/app/api/admin/companies/[id]/invite-links/[linkId]/route.patch.ts` | `withZodBody` puro |
| `apps/web/src/app/api/business/invite-links/[id]/route.ts` | `withZodBody` puro |
| `apps/web/src/app/api/[orgSlug]/business/invite-links/[id]/route.ts` | `withZodBody` puro |
| `apps/web/src/app/api/profile/password/route.ts` | `withZodBody` + session |
| `apps/web/src/app/api/lia/feedback/route.ts` | `withZodBody` + Supabase auth |
| `apps/web/src/app/api/courses/[slug]/rating/route.ts` | `withZodBody` + params |
| `apps/web/src/app/api/admin/users/create/route.ts` | `withZodBody` + `requireAdmin` |
| `apps/web/src/app/api/security/verify-human/route.ts` | `withZodBody` con `apiError` |
| `apps/web/src/app/api/auth/mfa/activate/route.ts` | `withAuth` + parseo manual con Zod |
| `apps/web/src/app/api/auth/mfa/verify/route.ts` | `withAuth` + parseo manual con Zod |
| `apps/web/src/app/api/auth/mfa/route.ts` (DELETE/PUT) | `withAuth` + parseo manual con Zod |

## Lista por dominio (rutas restantes)

Listado de las ~200 rutas pendientes generado con:

```bash
grep -lR "await request\.json\(\)\|await req\.json\(\)" apps/web/src/app/api
```

Asignar por dominio para paralelización segura:

| Dominio | Rutas aprox. | Sugerencia |
|---|---:|---|
| `/api/admin/*` | 35 | Agente 1 — privilegio máximo, hacer primero |
| `/api/[orgSlug]/business/*` | 40 | Agente 2 |
| `/api/business/*` | 30 | Agente 3 |
| `/api/courses/*` | 25 | Agente 4 |
| `/api/study-planner/*` | 25 | Agente 5 |
| `/api/lia/*` | 12 | Agente 6 |
| `/api/security/*` | 4 restantes | Agente 6 |
| `/api/communities/*` | 8 | Agente 7 |
| `/api/scorm/*` | 5 | Agente 7 |
| `/api/reels/*` | 4 | Agente 7 |
| Resto (`profile`, `auth`, `tts`, `tours`, `notifications`, etc.) | 20 | Agente 8 |

## Checklist por ruta migrada

- [ ] `./schema.ts` existe y exporta schema + tipo
- [ ] `route.ts` importa `withZodBody`, `apiError`, schema + tipo
- [ ] Handler interno tiene firma `(request, body, context)` donde body está tipado
- [ ] No quedan `request.json()` ni `parse()` manuales en el handler
- [ ] Todos los `NextResponse.json({ error })` se cambiaron a `apiError(...)`
- [ ] Si la ruta requería auth, está compuesta con `withAuth`
- [ ] Si la ruta requería org access, usa `requireOrgAccess`
- [ ] Test mínimo: caso happy + 2 casos inválidos en `__tests__/schema.test.ts`

## Anti-patrones a corregir cuando aparezcan

| Anti-patrón | Reemplazo |
|---|---|
| `const { x } = body; if (!x) ...` | quitar — el schema ya lo valida |
| `if (typeof x !== 'string') ...` | quitar — el schema ya lo valida |
| `JSON.parse(...)` en handler | mover a `withZodBody` |
| `request.json() as MyType` (cast) | usar el tipo inferido de Zod |
| `try { request.json() } catch { return 400 }` | quitar — `withZodBody` lo maneja |
| Schemas inline mezclados con `route.ts` | mover a `schema.ts` |
