# Reparacion de conexion de empresas

## Contexto

Despues de la refactorizacion, el flujo de empresas quedo partido entre:

- Superadministracion: `/admin/companies` y `/api/admin/companies`.
- Panel empresarial: `/{orgSlug}/business-panel/settings` y `/api/{orgSlug}/business/settings`.

La fuente de verdad revisada es `database-optimization/02-schema/RefactoSQL.sql`.

## Problemas encontrados

- El codigo consultaba `organization_subscriptions`, pero esa tabla no existe en el esquema actual.
- Rutas de configuracion y detalle usaban `SELECT_COLUMNS` sin importarlo, lo que rompe en runtime.
- Los servicios admin de empresas usaban el cliente Supabase request-scoped (`createClient`) aunque las rutas ya validan `requireAdmin`. Bajo RLS, esto puede ocultar organizaciones al superadmin.
- La configuracion de empresa debe depender de `organizations`: datos generales, branding, plan, estado, limites y campos de contexto empresarial.

## Decision de fase 1

- Reparar la conexion de empresas usando `organizations` como fuente de verdad.
- Usar `createAdminClient` solo en servicios server-side del modulo admin de empresas, despues de pasar por `requireAdmin`.
- Mantener `requireBusiness({ organizationSlug })` para el panel empresarial y resolver la organizacion por slug.
- No crear tablas nuevas ni migraciones destructivas.
- No ampliar el apartado de suscripciones en esta fase.

## Segunda fase

Suscripciones queda como fase 2 porque hoy solo funciona como fallback o informacion complementaria. Esa fase debe decidir si el producto necesita:

- Suscripcion por organizacion en `organizations`.
- Tabla dedicada de historial/ciclos de suscripcion organizacional.
- Sincronizacion entre pagos, limites y estado de empresa.

Hasta entonces, los endpoints de configuracion no deben depender de tablas de suscripcion inexistentes.

## Validacion esperada

- Superadmin puede listar empresas aunque no pertenezca a `organization_users`.
- Superadmin puede abrir detalle/configuracion de empresa sin error por selects faltantes.
- Owner/admin puede abrir configuracion de su empresa desde `/{orgSlug}/business-panel/settings`.
- La respuesta de settings contiene `organization`, `userRole` y un snapshot minimo de plan derivado de `organizations`.
