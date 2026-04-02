# Migration Audit

Fecha de auditoria: 2026-04-02

## Resumen ejecutivo

- `supabase/migrations/` contiene 49 archivos SQL activos.
- Hay deuda de drift, pero no por falta total de migraciones: el problema principal es la mezcla de archivos timestamped con scripts incrementales sin timestamp.
- La estrategia de seguridad principal sigue siendo capa API + service role server-side. Eso esta documentado en [004_add_rls_policies.sql](./migrations/004_add_rls_policies.sql) y sigue alineado con el uso de autenticacion personalizada.
- Se creo la migracion [20260402130000_add_calendar_integrations_lookup_index.sql](./migrations/20260402130000_add_calendar_integrations_lookup_index.sql) para cubrir un lookup real que antes dependia solo de `user_id` y un `ORDER BY updated_at DESC`.

## Hallazgos clave

### 1. Historial de migraciones heterogeneo

- Existen migraciones con prefijos numericos (`001_` a `004_`), con timestamp completo (`20260204120000_...`) y varios scripts sin timestamp.
- Los scripts sin timestamp siguen siendo utiles, pero no ofrecen orden deterministico fuerte si se usan como migraciones operativas.
- Riesgo: el historial es entendible para humanos, pero no lo bastante fiable como fuente unica de verdad para reconstruccion automatica.

### 2. Scripts de indices fuera de la linea base

Evidencia:

- [002_add_indexes.sql](./migrations/002_add_indexes.sql) ya define indices base para `study_sessions`, incluyendo `organization_id`, `status` y `start_time`.
- [optimize-indexes-for-scale.sql](./migrations/optimize-indexes-for-scale.sql) agrega varios indices utiles para `study_sessions`, `lia_conversations` y `calendar_integrations`, pero sigue siendo un script sin timestamp.

Impacto:

- Algunas optimizaciones de rendimiento existen en el repo, pero no todas estan consolidadas en migraciones con orden fuerte.
- El caso mas claro era `calendar_integrations`: habia indice por `user_id`, pero no uno timestamped que cubriera el patron `WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1`.

Accion:

- Se agrego un indice especifico y timestamped para ese patron:
  - [20260402130000_add_calendar_integrations_lookup_index.sql](./migrations/20260402130000_add_calendar_integrations_lookup_index.sql)

### 3. Estrategia RLS: deuda de verificacion, no de ausencia ciega

Evidencia:

- [004_add_rls_policies.sql](./migrations/004_add_rls_policies.sql) documenta explicitamente que el proyecto usa autenticacion personalizada y que `auth.uid()` no aplica a las tablas principales.
- El archivo mantiene comentada la alternativa con RLS para defensa en profundidad.

Conclusiones:

- No es correcto asumir que la falta de RLS en `study_sessions`, `lia_conversations` o `study_plans` sea automaticamente un bug.
- La deuda real aqui es de verificacion continua:
  - asegurar que todas las rutas server-side autentiquen antes de usar service role
  - reducir rutas grandes con queries sensibles mezcladas con logica de negocio
  - evitar clientes admin creados inline y fuera de puntos auditables

### 4. Consolidacion y limpieza historica

Evidencia:

- [cleanup_redundancias.sql](./migrations/cleanup_redundancias.sql) elimina columnas y tablas completas: communities, reels, prompts, coupons, learning routes, entre otras.
- Las migraciones de enero 2025 de `lia_personalization_settings` agregan y luego eliminan varias columnas en dias consecutivos.

Riesgo:

- El historial conserva bastante ruido historico que complica auditar el estado final.
- No se deben borrar migraciones viejas, pero si conviene tener una base consolidada o snapshot documentado para nuevos entornos.

### 5. Documentacion desactualizada sobre snapshots

Evidencia:

- [MIGRATIONS.md](./MIGRATIONS.md) menciona `BD.sql` y `Database.sql` dentro de `supabase/migrations/`.
- En esta auditoria ambos archivos ya no existen en ese directorio.

Accion recomendada:

- Actualizar [MIGRATIONS.md](./MIGRATIONS.md) para reflejar el estado real del repo y evitar falsas alarmas durante futuras auditorias.

### 6. `looseQuery.ts` y tipos generados

Hallazgo:

- [apps/web/src/lib/supabase/looseQuery.ts](../apps/web/src/lib/supabase/looseQuery.ts) ya no contiene una lista dura de tablas fuera del schema generado; hoy es una abstraccion generica.
- Tablas que antes eran sospechosas de drift como `lesson_tracking` y `user_tour_progress` ya existen en [apps/web/src/lib/supabase/types.ts](../apps/web/src/lib/supabase/types.ts).

Conclusion:

- En esta tanda no se detecto un desfase concreto entre `looseQuery.ts` y `types.ts`.
- La deuda residual esta mas en rutas que usan clientes demasiado permissive o queries sin encapsular, no en `looseQuery.ts`.

## Candidatos prioritarios para la siguiente consolidacion

1. Mover indices utiles de scripts sin timestamp a migraciones timestamped cuando exista evidencia directa de uso en codigo.
2. Actualizar [MIGRATIONS.md](./MIGRATIONS.md) para quitar referencias obsoletas y separar claramente scripts operativos vs scripts auxiliares.
3. Crear una linea base documentada del schema actual para reducir el costo de auditorias futuras.
4. Seguir adelgazando rutas server-side que usan service role e integraciones OAuth en el mismo archivo.

## Estado despues de esta auditoria

- Infraestructura de migraciones: mejor documentada, pero no consolidada por completo.
- Seguridad BD: la estrategia real queda confirmada como API-layer security + service role server-side.
- Rendimiento BD: mejora puntual aplicada en `calendar_integrations`, con deuda residual en consolidacion historica y verificacion de uso de indices auxiliares.
