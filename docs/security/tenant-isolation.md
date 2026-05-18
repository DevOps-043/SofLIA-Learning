# Tenant isolation

## Tarea cubierta

TECH_DEBT_REMEDIATION.md 5.1 - Autorizacion por tenant.

## Control implementado

`requireOrgAccess` vive en `apps/web/src/lib/auth/business-auth/organization.service.ts` y valida:

- organizacion activa por `organizationId` o `organizationSlug`;
- membresia activa en `organization_users`;
- acceso excepcional de platform admin solo cuando el caller lo habilita explicitamente;
- retorno de `organizationId`, `organizationSlug`, `organizationRole` e `isOrgAdmin` para filtrar queries posteriores.

`requireBusiness` y `requireBusinessUser` delegan a este flujo cuando reciben `organizationSlug`/`organizationId`, por lo que las rutas `/api/[orgSlug]/*` existentes quedan cubiertas sin reescribir cada handler.

## Evidencia local

| Evidencia | Resultado |
|---|---|
| Route files bajo `/api/[orgSlug]` | 120 |
| Ocurrencias de `requireBusiness`, `requireBusinessUser` o `requireOrgAccess` bajo `/api/[orgSlug]` | 140 |
| Test unitario cross-tenant | `business-auth.organization.service.test.ts` |
| Test estatico de rutas multi-tenant | `tenant-isolation-routes.test.ts` |

## Regla de query

Toda query que toque tablas con `organization_id` debe filtrar por `organizationId` resuelto por el guard, incluso si RLS tambien protege la tabla.

## Riesgo residual

La validacion agregada cubre la barrera de codigo y evita regresiones en nuevas rutas `[orgSlug]`. La prueba E2E con usuarios reales de Org A/Org B queda como validacion de staging/QA porque requiere fixtures y sesiones reales fuera del repositorio local.
