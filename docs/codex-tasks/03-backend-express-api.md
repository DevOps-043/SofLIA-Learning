# CODEX TASK — Backend: Express API (`apps/api`)

**Peso en TDI:** 10% | **Deuda residual actual:** ~60%
**Fecha de corte:** 2026-04-02 (worktree real)
**Estado:** Infraestructura base + dominio Notificaciones implementados. Aporta 6.0pp al TDI.

---

## Ya resuelto — NO tocar

### Infraestructura base ✅

| Archivo | Líneas | Estado |
|---|---|---|
| `core/middleware/auth.ts` | ~146 | JWT Supabase verificado ✅ |
| `core/middleware/errorHandler.ts` | — | Captura Zod/Supabase/NotFound ✅ |
| `core/middleware/rateLimit.ts` | — | Rate limiting por IP + userId ✅ |
| `core/middleware/role.ts` | — | Validación de rol Admin/Business/BusinessUser ✅ |
| `core/validation/` | — | Middleware Zod centralizado ✅ |

### Dominio Notificaciones ✅ (FASE 2 completa)

```
apps/api/src/features/notifications/
├── notifications.controller.ts    # ~86 líneas ✅
├── notifications.service.ts       # ~121 líneas ✅
├── notifications.repository.ts    ✅
├── notifications.routes.ts        ✅
├── notifications.types.ts         ✅
├── notifications.utils.ts         ✅
└── __tests__/                     # 37 test cases en apps/api total ✅
```

Endpoints implementados:
```
GET    /api/v1/notifications                # getUserNotifications paginado ✅
GET    /api/v1/notifications/unread-count   ✅
PATCH  /api/v1/notifications/:id/read       ✅
PATCH  /api/v1/notifications/mark-all-read  ✅
PATCH  /api/v1/notifications/:id/archive    ✅
DELETE /api/v1/notifications/:id            ✅
```

**Tests en `apps/api`: 37 test cases en 7 archivos — todos verdes ✅**

---

## Pendiente — dominios por implementar

### FASE 3 — Admin Users (próximo dominio a atacar)

```
apps/api/src/features/admin/users/
├── admin-users.controller.ts
├── admin-users.service.ts
├── admin-users.repository.ts
├── admin-users.routes.ts
├── admin-users.types.ts          # Zod schemas: CreateUserSchema, UpdateUserSchema, etc.
└── __tests__/
    ├── admin-users.controller.test.ts
    └── admin-users.service.test.ts
```

Endpoints a implementar:
```
GET    /api/v1/admin/users            # paginado, filtro por búsqueda/rol/estado
GET    /api/v1/admin/users/stats      # totales: activos, por rol, por org
GET    /api/v1/admin/users/:id        # detalle con org y roles
PATCH  /api/v1/admin/users/:id        # actualizar perfil
PATCH  /api/v1/admin/users/:id/role   # cambiar rol
DELETE /api/v1/admin/users/:id        # soft delete (status = 'deleted')
```

Referencia: `features/admin/services/adminUsers.service.ts` (web) ya es facade de 57 líneas.
El dominio Express recibe esas queries directamente a Supabase con service role key.

---

### FASE 4 — Business Analytics

Este dominio ya tiene servicios modularizados en el frontend (post-refactorización).
El backend Express sirve como capa de agregación con service role key para queries cross-org.

```
apps/api/src/features/business/analytics/
├── analytics.controller.ts
├── analytics.service.ts
├── analytics.routes.ts
├── analytics.types.ts          # Zod para DateRange, OrgId, etc.
└── __tests__/
    └── analytics.service.test.ts
```

Endpoints a implementar:
```
GET    /api/v1/business/:orgId/analytics         # métricas de engagement + usuarios
GET    /api/v1/business/:orgId/analytics/teams   # métricas por equipo
GET    /api/v1/business/:orgId/analytics/export  # exportar a CSV/Excel
```

---

### FASE 5 — Courses Domain

```
apps/api/src/features/courses/
├── courses.controller.ts
├── courses.service.ts
├── courses.routes.ts
├── courses.types.ts
└── __tests__/
```

Endpoints prioritarios:
```
GET    /api/v1/courses                          # catálogo con paginación
GET    /api/v1/courses/:id/progress/:userId     # progreso del usuario en el curso
PATCH  /api/v1/courses/:id/lessons/:lessonId/progress  # actualizar progreso de lección
```

---

### FASE 6 — Study Planner Domain

```
apps/api/src/features/study-planner/
├── study-planner.controller.ts
├── study-planner.service.ts
├── study-planner.routes.ts
├── study-planner.types.ts
└── __tests__/
```

---

## Reglas para Codex en este módulo

1. **Nunca duplicar lógica.** Reutilizar servicios ya probados del frontend donde sea posible.
2. **Zod en todos los endpoints.** Cada ruta con body/params tiene schema de validación.
3. **JWT de Supabase.** No crear sistema de auth propio. Verificar tokens que emite Supabase.
4. **Tests con Vitest.** Mismo framework que el frontend. Mismo patrón `makeSupabase()`.
5. **Mocks de Supabase.** Mockear el cliente, nunca llamadas reales en tests.
6. **Sin `any`.** Todos los tipos explícitos desde el inicio.
7. **Un dominio = un commit atómico.**
8. **Seguir el patrón de Notificaciones** — es el dominio de referencia del proyecto.

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

- **Fase 3 (Admin Users):** TDI Backend baja de ~60% a ~50%
- **Fase 4 (Business Analytics):** TDI Backend baja a ~42%
- **Fase 5 (Courses):** TDI Backend baja a ~35%
- **Fase 6 (Study Planner):** TDI Backend baja a ~28%

> Cada dominio implementado reduce ~1pp el TDI global.
