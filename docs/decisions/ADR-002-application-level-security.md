# ADR-002: Seguridad a nivel de aplicación en lugar de RLS de Supabase

**Estado:** Aceptado
**Fecha:** 2026-03-30

## Contexto

Supabase ofrece Row Level Security (RLS) como mecanismo de seguridad a nivel de base de datos. Sin embargo, este proyecto usa **autenticación personalizada** basada en JWT propio, no Supabase Auth.

## Decisión

La seguridad de datos se implementa a nivel de aplicación, no mediante RLS de Supabase.

**Mecanismos implementados:**
- `requireAdmin()` — `apps/web/src/lib/auth/requireAdmin.ts` — verifica rol Admin en tabla `usuarios`
- `requireBusiness()` — `apps/web/src/lib/auth/requireBusiness.ts` — verifica membresía en la organización
- Filtro de `organization_id` obligatorio en todas las queries de negocio
- Service role key usada exclusivamente server-side (nunca expuesta al cliente)

## Razones

1. **Incompatibilidad con `auth.uid()`**: Las políticas RLS estándar de Supabase dependen de `auth.uid()`, que devuelve el usuario de Supabase Auth. Este proyecto usa JWT personalizado, por lo que `auth.uid()` devuelve NULL en todas las requests.
2. **Service role como capa de defensa**: Todas las queries de API usan la service role key (server-side). El cliente nunca tiene acceso directo a la BD.
3. **Multi-tenancy implementado en API**: Cada ruta valida que el usuario pertenezca a la organización antes de acceder a datos. El filtro de `organization_id` es parte del patrón de todas las queries.

## Excepciones — tablas CON RLS

Algunas tablas tienen RLS habilitado porque el acceso puede ser más directo o porque usan Supabase Storage:
- `lia_personalization_settings` — acceso desde componentes con `anonKey`
- `hierarchy_chats`, `hierarchy_chat_messages`, `hierarchy_chat_participants` — chats de tiempo real
- `organization_node_*`, `skills`, `skill_badges`, `course_skills` — tablas de módulos más recientes
- Buckets de Storage: `hierarchy-images`, `hierarchy-chat-files`, `panel-business`

## Consecuencias

- Al añadir nuevas tablas principales, **no es necesario** (ni útil) habilitar RLS. La seguridad viene del middleware.
- Al añadir tablas que se acceden desde el cliente con `anonKey`, **sí es necesario** añadir RLS.
- Si en el futuro se migra a Supabase Auth, habría que revisar todas las políticas RLS.

## Alternativas consideradas

**Migrar a Supabase Auth**: Descartado a corto plazo. Implicaría cambiar el flujo de autenticación SSO, la gestión de tokens y todos los middlewares existentes.

**RLS con `service_role` bypass**: Habilitado en tablas nuevas como capa de defensa adicional, pero el `service_role` bypass significa que la seguridad real sigue siendo la capa de API.
