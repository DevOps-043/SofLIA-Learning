# CODEX TASK — Seguridad

**Peso en TDI:** 10% | **Deuda residual actual:** ~28%
**Fecha de corte:** 2026-04-02 (worktree real)

---

## Ya resuelto — NO tocar

| Área | Archivo / Acción | Estado |
|---|---|---|
| Secretos cliente | ElevenLabs API key eliminada de todos los clientes | ✅ |
| Proxy TTS | `/api/tts` con Zod + rate limiting | ✅ |
| Supabase client | `lib/supabase/server.ts` — stateless, sin cache global | ✅ |
| OAuth | OAuth flow modularizado (`oauth-flow/` con servicios separados) | ✅ |
| Invitaciones | `invitation.ts` 789 → **120** líneas — modularizado | ✅ |
| Auth utils | `lib/auth/requireBusiness.ts` 684 → **50** líneas | ✅ |
| Auth utils | `lib/auth/hierarchicalAccess.ts` 627 → **1** línea | ✅ |
| Email service | `features/auth/services/email.service.ts` 630 → **145** líneas | ✅ |
| Rate limiting auth | `app/api/auth/{logout,me,refresh,sessions,questionnaire-status}` | ✅ |
| Rate limiting AI | `app/api/ai-chat/route.ts` + `dashboard/chat/route.ts` | ✅ |

---

## Pendiente — ordenado por riesgo

### BLOQUE 1 — Session Recording (rrweb) — PRIORIDAD ALTA

**TAREA 1A — `lib/rrweb/session-recorder.ts` (328 líneas — reducido de 701, aún pendiente)**

> El archivo graba sesiones de usuario (clicks, inputs, navegación). La reducción a 328 líneas
> fue parcial. Faltan: modularizar los filtros de privacidad y crear tests obligatorios.

Separación pendiente:
```
lib/rrweb/
├── session-recorder.ts                 # orquestador ≤150 líneas
├── session-recorder-filters.ts         # filtrar campos sensibles (inputs password, etc.)
├── session-recorder-privacy.ts         # máscaras y exclusiones de privacidad
├── session-recorder-upload.ts          # subida de eventos al servidor
└── __tests__/
    ├── session-recorder-filters.test.ts    # CRÍTICO — verificar que passwords se filtran
    └── session-recorder-privacy.test.ts    # CRÍTICO — verificar máscaras
```

Tests no negociables para `session-recorder-filters.test.ts`:
```typescript
it('masks value of input[type=password]')
it('does not capture credit card number inputs')
it('respects data-no-record attribute')
it('filters sensitive URL params')
it('does NOT mask regular text inputs')
it('masks inputs inside forms with class sensitive')
```

Leer `docs/ANALISIS_RRWEB.md` antes de tocar este archivo.

---

### BLOQUE 2 — Type-check en archivos de seguridad

Los siguientes archivos tienen errores de TypeScript activos que afectan seguridad:

| Archivo | Error | Riesgo |
|---|---|---|
| `lib/validation/password-security.ts` | TS2558 | Validación de contraseñas con tipo incorrecto |
| `lib/sanitize/enhanced-dom-purify.ts` | TS18046 | Sanitizador con tipo `unknown` sin narrowing |
| `lib/supabase/pool.ts` | TS2345 | Pool de conexiones mal tipado |

**TAREA 2A — Corregir `lib/validation/password-security.ts` (TS2558)**

TS2558 = "Expected X type arguments but got Y". Un genérico recibe más tipos de los que acepta.

```bash
npm run type-check --workspace=apps/web 2>&1 | grep -A 8 "password-security"
```

**TAREA 2B — Corregir `lib/sanitize/enhanced-dom-purify.ts` (TS18046)**

TS18046 = "X is of type 'unknown'". Una variable se usa sin type guard previo.

```typescript
// Fix patrón:
function sanitize(input: unknown) {
  if (typeof input !== 'string') return ''
  return DOMPurify.sanitize(input)
}
```

Nota: hay 1 test fallando en `enhanced-dom-purify.test.ts` — corregirlo junto con el tipo.

---

### BLOQUE 3 — Security headers HTTP

**TAREA 3A — Agregar security headers en `next.config.js`**

```javascript
// next.config.js
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=()'
    // microphone=(self) necesario para las funciones de voz de SofLIA
  },
]
```

> NO agregar CSP aún — requiere análisis de todos los scripts externos (Supabase, ElevenLabs).

**TAREA 3B — Verificar que no quedan secretos hardcodeados**

```bash
grep -r "sk-" apps/web/src --include="*.ts" --include="*.tsx" -l
grep -r "ELEVEN" apps/web/src --include="*.ts" --include="*.tsx" -l
grep -r "service_role" apps/web/src --include="*.ts" --include="*.tsx" -l
```

---

### BLOQUE 4 — Auth form con lógica mezclada

**TAREA 4A — `features/auth/components/OrganizationAuth/OrganizationLoginForm.tsx` (435 líneas)**

Reducido de 660 pero aún en 435 líneas. Lógica de autenticación mezclada con render UI.
Ver `02-frontend-componentes.md` BLOQUE 4 para la extracción completa.

Objetivo: ≤150 líneas (shell UI) + `useOrganizationLoginFormLogic.ts` separado.

---

## Reglas para Codex en este módulo

1. **Tests de seguridad son obligatorios**, no opcionales. Especialmente filtros de datos sensibles.
2. **No cambiar el comportamiento de auth** sin entender el flujo completo primero.
3. **Leer `docs/ANALISIS_RRWEB.md`** antes de tocar `session-recorder.ts`.
4. **Errores TS en `lib/` deben corregirse sin cambiar la API pública** del módulo.
5. **No agregar logging de datos sensibles** (passwords, tokens) en ningún nuevo código.
6. **Rate limits son por userId cuando hay sesión**, por IP cuando no hay.
7. **Correr tests de seguridad primero** — si rompen, revertir y diagnosticar.

## Verificación

```bash
# Tests críticos de seguridad
cd apps/web && npx vitest run --reporter=verbose src/lib/rrweb/__tests__/
npx vitest run --reporter=verbose src/features/auth/actions/

# Type-check de archivos de seguridad
npm run type-check --workspace=apps/web 2>&1 | grep -E "password-security|enhanced-dom|pool"

# Buscar secretos
grep -rn "sk-\|service_role\|anon_key" apps/web/src --include="*.ts" --include="*.tsx"
```

## Métrica de éxito

- `session-recorder.ts` ≤ 150 líneas con tests de filtrado de datos sensibles
- `lib/validation/password-security.ts` sin errores TS
- `lib/sanitize/enhanced-dom-purify.ts` sin errores TS + test verde
- Security headers configurados en `next.config.js`
- 0 secretos hardcodeados en `apps/web/src`
- TDI Seguridad: de ~28% a ~15%
