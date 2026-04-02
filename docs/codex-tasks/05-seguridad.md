# CODEX TASK — Seguridad

**Peso en TDI:** 10% | **Deuda residual estimada:** ~50-55%
**Fecha de corte:** 2026-04-01
**Estado:** Parcialmente resuelto — secretos del cliente eliminados, pero auth/session
y session recording siguen con deuda crítica.

---

## Lo que ya está hecho (NO tocar)

- ElevenLabs API key eliminada de todos los clientes ✅
- Proxy server-side `/api/tts` con validación Zod y rate limiting ✅
- `lib/supabase/server.ts` — cache global por cookies eliminado, cliente stateless ✅
- `useProfile.ts` — ya no accede Supabase directo desde el cliente ✅
- OAuth flow modularizado (`oauth-flow/` con servicios separados) ✅
- `OnboardingAgent`, `useLiaSidePanelLogic`, `useContextualVoiceGuideLogic` — sin secretos embebidos ✅
- `useAIChatVoice.ts` y `useStudyPlannerVoiceInteraction.ts` usan `/api/tts` ✅

---

## Pendiente — ordenado por riesgo

### BLOQUE 1 — Crítico: Auth y Session

**TAREA 1A — `features/auth/actions/invitation.ts` (789 líneas) — PRIORIDAD MÁXIMA**

> ⚠️ Este archivo combina lógica sensible (auth + invitaciones + SSO) sin tests.
> Un bug aquí afecta el proceso de onboarding completo de cada empresa cliente.

Problemas de seguridad específicos:
- Validación de tokens de invitación inline sin servicio dedicado y testeable
- Incremento de `bulk_invite_links.current_uses` puede tener race condition
- Manejo de errores inconsistente — algunos errores se tragan silenciosamente
- Sin límite de intentos de canjeo de invitación

Acciones requeridas:
1. Extraer a `invitation/` (ver `01-arquitectura-modularidad.md` TAREA 1A)
2. En `invitation-validation.service.ts`: validar expiración, estado, usos máximos
3. En `invitation-redemption.service.ts`: update atómico de `current_uses` con check previo
4. Agregar tests para el flujo de validación y canjeo
5. Documentar en tests los casos edge: token expirado, ya canjeado, usos agotados

**TAREA 1B — `features/auth/components/OrganizationAuth/OrganizationLoginForm.tsx` (660 líneas)**

- Lógica de autenticación mezclada con render UI
- Side effects (redirect, token storage) inline en el componente
- Ver `01-arquitectura-modularidad.md` TAREA 2D para la extracción

---

### BLOQUE 2 — Crítico: Session Recording (rrweb)

**TAREA 2A — `lib/rrweb/session-recorder.ts` (701 líneas reales — doc dice 643)**

> ⚠️ Este archivo graba sesiones de usuario (clicks, inputs, navegación). Sin tests.
> El ANALISIS_RRWEB.md y CHECKLIST_RRWEB.md en `docs/` contienen contexto adicional.

Problemas identificados:
- Sin modularizar — toda la lógica de capture, filtrado y upload en un archivo
- Sin tests — no hay forma de verificar que datos sensibles se filtran correctamente
- El filtrado de inputs sensibles (contraseñas, tarjetas) es crítico y debe ser testeable

Separación esperada:
```
lib/rrweb/
├── session-recorder.ts                # orquestador ≤150 líneas
├── session-recorder-config.ts         # configuración de captura
├── session-recorder-filters.ts        # filtrar campos sensibles (inputs password, etc.)
├── session-recorder-upload.ts         # subida de eventos al servidor
├── session-recorder-privacy.ts        # máscaras y exclusiones de privacidad
└── __tests__/
    ├── session-recorder-filters.test.ts   # CRÍTICO — verificar que passwords se filtran
    └── session-recorder-privacy.test.ts   # CRÍTICO — verificar máscaras
```

Tests obligatorios para `session-recorder-filters.test.ts`:
```typescript
it('should mask input[type=password] values', ...)
it('should not capture credit card number inputs', ...)
it('should respect data-no-record attribute', ...)
it('should filter sensitive URL params', ...)
```

---

### BLOQUE 3 — Medio: Type-check en archivos de seguridad

Los siguientes archivos de seguridad/infraestructura tienen errores de TypeScript activos:

| Archivo | Error | Riesgo |
|---|---|---|
| `lib/supabase/pool.ts` | TS2345 | Pool de conexiones mal tipado |
| `lib/validation/password-security.ts` | TS2558 | Validación de contraseñas con tipo incorrecto |
| `lib/sanitize/enhanced-dom-purify.ts` | TS18046 | Sanitizador con tipo desconocido |

**TAREA 3A — Corregir errores TS en archivos de seguridad**

Orden de corrección:
1. `lib/validation/password-security.ts` — validación de contraseñas es crítica
2. `lib/sanitize/enhanced-dom-purify.ts` — sanitizador de HTML
3. `lib/supabase/pool.ts` — pool de conexiones

Para cada uno: corregir el error TS sin cambiar comportamiento. Si el tipo correcto
requiere un cambio de API, documentarlo antes de implementar.

```bash
# Verificar errores actuales
npm run type-check --workspace=apps/web 2>&1 | grep -E "password|sanitize|pool"
```

---

### BLOQUE 4 — Bajo: Headers de seguridad HTTP

**TAREA 4A — Agregar security headers en `next.config.js`**

Headers que deben configurarse:
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

> ⚠️ NO agregar CSP (Content Security Policy) aún — requiere análisis de todos los scripts
> externos (Supabase, ElevenLabs, etc.) para no romper funcionalidades.

**TAREA 4B — Verificar que no quedan secretos hardcodeados**

```bash
# Buscar posibles secretos hardcodeados
grep -r "sk-" apps/web/src --include="*.ts" --include="*.tsx" -l
grep -r "ELEVEN" apps/web/src --include="*.ts" --include="*.tsx" -l
grep -r "service_role" apps/web/src --include="*.ts" --include="*.tsx" -l
```

Si algún resultado aparece fuera de `.env*` o archivos de ejemplo: corregir inmediatamente.

---

### BLOQUE 5 — Rate limiting ampliado

**TAREA 5A — Rate limiting en endpoints de autenticación**

Los endpoints de login/registro no tienen rate limiting:
```
app/api/auth/*/route.ts  — verificar si existen y si tienen rate limit
```

Patrón a usar (igual que `/api/tts`):
```typescript
import { rateLimit } from '@/lib/rate-limit'
const limiter = rateLimit({ max: 5, windowMs: 15 * 60 * 1000 }) // 5 intentos / 15 min
```

---

## Reglas para Codex en este módulo

1. **Los tests de seguridad son obligatorios**, no opcionales. Especialmente para filtros de datos sensibles.
2. **No cambiar el comportamiento de auth** sin entender el flujo completo primero.
3. **Leer `docs/ANALISIS_RRWEB.md`** antes de tocar `session-recorder.ts`.
4. **Los errores TS en `lib/` deben corregirse sin cambiar la API pública** del módulo.
5. **No agregar logging de datos sensibles** (passwords, tokens) en ningún nuevo código.
6. **Rate limits son por userId cuando hay sesión**, por IP cuando no hay.

## Verificación

```bash
# Tests de seguridad críticos
npx vitest run --reporter=verbose apps/web/src/lib/rrweb/__tests__/
npx vitest run --reporter=verbose apps/web/src/features/auth/actions/invitation/

# Verificar type-check de archivos de seguridad
npm run type-check --workspace=apps/web 2>&1 | grep -E "password-security|enhanced-dom|pool"

# Buscar secretos
grep -rn "sk-\|ELEVEN\|service_role\|anon_key" apps/web/src --include="*.ts" --include="*.tsx"
```

## Métrica de éxito

- `session-recorder.ts` ≤ 150 líneas con tests de filtrado de datos sensibles
- `invitation.ts` (789) modularizado con tests de validación y canjeo
- 0 errores TS en `lib/validation/` y `lib/sanitize/`
- Security headers configurados en `next.config.js`
- 0 secretos hardcodeados en `apps/web/src`
