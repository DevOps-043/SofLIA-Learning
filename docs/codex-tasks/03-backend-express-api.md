# CODEX TASK — Backend: Express API (`apps/api`)

**Peso en TDI:** 10% | **Deuda residual estimada:** ~92% (sin cambios desde baseline)
**Fecha de corte:** 2026-04-01
**Estado:** CRÍTICO — `apps/api` es un placeholder. Aporta 9.2pp de piso mínimo al TDI
que no puede reducirse mientras siga sin implementar.

---

## Lo que ya está hecho

- Estructura de directorios creada: `features/`, `core/`, `shared/` ✅
- `package.json` configurado con TypeScript y Express ✅
- Algunos controladores placeholder existen pero sin lógica real
- Health endpoint funcional: `GET /health` ✅

**Lo que NO existe aún:**
- Ningún dominio de negocio real implementado en Express
- 0 tests en `apps/api`
- Sin validación Zod sistemática
- Sin rate limiting
- Sin middleware de autenticación JWT real

---

## Por qué esto bloquea el TDI

El cálculo del TDI tiene un **piso estructural de ~29.8pp** formado por:
- Backend (92% × 0.10) = **9.2pp**
- Seguridad (55% × 0.10) = 5.5pp
- BD (58% × 0.10) = 5.8pp
- Testing (60% × 0.15) = 9.3pp

Mientras `apps/api` siga siendo un placeholder, **el TDI no puede bajar de ~14-15%
aunque se resuelva todo lo demás**. Este es el cambio de mayor impacto estructural
a largo plazo.

---

## Pendiente — plan de implementación por dominios

### FASE 1 — Infraestructura base (prerequisito para todo lo demás)

**TAREA 1A — Middleware de autenticación JWT**

Crear `apps/api/src/core/middleware/auth.middleware.ts`:
```typescript
// Validar JWT de Supabase en cada request protegido
// Extraer userId, orgSlug, role del token
// Rechazar con 401 si inválido o expirado
// NO reimplementar auth — verificar el JWT que emite Supabase
```

Estructura:
```
apps/api/src/core/middleware/
├── auth.middleware.ts       # verificar JWT Supabase
├── role.middleware.ts       # validar rol (Admin, Business, BusinessUser)
├── rateLimit.middleware.ts  # rate limiting por IP + userId
└── __tests__/
    ├── auth.middleware.test.ts
    └── role.middleware.test.ts
```

**TAREA 1B — Validación Zod centralizada**

```
apps/api/src/core/
├── validation/
│   ├── validate.middleware.ts   # middleware que valida req.body con schema Zod
│   ├── common.schemas.ts        # paginación, UUID, fechas
│   └── __tests__/
│       └── validate.middleware.test.ts
```

**TAREA 1C — Error handler unificado**

```typescript
// apps/api/src/core/middleware/error.middleware.ts
// Capturar ZodError → 400 con detalle de campos
// Capturar errores Supabase → 500 con código interno
// Capturar NotFoundError → 404
// Nunca exponer stack trace en producción
```

---

### FASE 2 — Primer dominio real: Notificaciones

Las notificaciones ya están completamente refactorizadas en el frontend
(`notification/creation.service.ts`, `notification/actions.service.ts`, etc.).
El backend Express puede envolver esa lógica como primera implementación real.

**TAREA 2A — Notifications Controller + Routes**

```
apps/api/src/features/notifications/
├── notifications.controller.ts
├── notifications.service.ts     # re-usa lógica ya probada del frontend
├── notifications.routes.ts
├── notifications.types.ts       # Zod schemas para validación
└── __tests__/
    ├── notifications.controller.test.ts
    └── notifications.service.test.ts
```

Endpoints a implementar:
```
GET    /api/v1/notifications           # getUserNotifications (paginado)
GET    /api/v1/notifications/unread-count
PATCH  /api/v1/notifications/:id/read
PATCH  /api/v1/notifications/mark-all-read
PATCH  /api/v1/notifications/:id/archive
DELETE /api/v1/notifications/:id
```

---

### FASE 3 — Segundo dominio: Admin Users

```
apps/api/src/features/admin/users/
├── admin-users.controller.ts
├── admin-users.service.ts
├── admin-users.routes.ts
├── admin-users.types.ts
└── __tests__/
    └── admin-users.service.test.ts
```

Endpoints:
```
GET    /api/v1/admin/users            # paginado + búsqueda
GET    /api/v1/admin/users/stats
GET    /api/v1/admin/users/:id
PATCH  /api/v1/admin/users/:id
PATCH  /api/v1/admin/users/:id/role
DELETE /api/v1/admin/users/:id
```

---

### FASE 4 — Tercer dominio: Business Analytics

Este dominio ya tiene servicios bien modularizados en el frontend. Migrar:
```
apps/api/src/features/business/analytics/
├── analytics.controller.ts
├── analytics.service.ts
├── analytics.routes.ts
├── analytics.types.ts
└── __tests__/
```

---

## Reglas para Codex en este módulo

1. **Nunca duplicar lógica.** Si el frontend tiene un servicio ya probado, reutilizar o mover — no reimplementar.
2. **Zod en todos los endpoints.** Cada ruta con body debe tener schema de validación.
3. **JWT de Supabase.** No crear sistema de auth propio. Verificar tokens que emite Supabase.
4. **Tests con Vitest.** Usar el mismo framework que el frontend.
5. **Mocks de Supabase.** Mockear el cliente, no hacer llamadas reales en tests.
6. **Sin `any`.** Todos los tipos explícitos desde el inicio.
7. **Un dominio = un commit.** No mezclar fases.

## Verificación

```bash
# Correr tests del backend
cd apps/api && npx vitest run --reporter=verbose

# Verificar que el servidor inicia
npm run dev:api
curl http://localhost:4000/health

# Type check del backend
npm run type-check --workspace=apps/api
```

## Métrica de éxito por fase

- **Fase 1:** Middleware de auth, Zod y error handler con tests — TDI Backend baja de 92% a ~75%
- **Fase 2:** Notificaciones implementadas — TDI Backend baja a ~65%
- **Fase 3:** Admin Users implementado — TDI Backend baja a ~55%
- **Fase 4:** Business Analytics implementado — TDI Backend baja a ~45%

> Cada fase reduce ~2pp el TDI global (peso 10% × mejora por dominio).
