# CODEX TASK — Base de Datos (Supabase / PostgreSQL)

**Peso en TDI:** 10% | **Deuda residual actual:** ~40%
**Fecha de corte:** 2026-04-02 (worktree real)

---

## Ya resuelto — NO tocar

| Área | Estado |
|---|---|
| `lib/supabase/server.ts` — cliente stateless sin cache global | ✅ |
| `lib/supabase/looseQuery.ts` — abstracción para tablas fuera de `types.ts` | ✅ |
| N+1 eliminados en communities y course detail | ✅ |
| Schema completo en `lib/supabase/types.ts` (generado) | ✅ |

### Índices de performance creados ✅

Migración: `supabase/migrations/20260402113000_planner_notifications_query_indexes.sql`

```sql
-- Integración de calendario: lookup por usuario + provider
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user_provider_updated_at
ON public.calendar_integrations (user_id, provider, updated_at DESC);

-- Sesiones del planner: queries por plan y tiempo
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_plan_start_time
ON public.study_sessions (user_id, plan_id, start_time ASC);

-- Sesiones con evento externo (calendar sync)
CREATE INDEX IF NOT EXISTS idx_study_sessions_calendar_sync_lookup
ON public.study_sessions (user_id, calendar_provider, start_time ASC, end_time ASC)
WHERE external_event_id IS NOT NULL;

-- Notificaciones no leídas por prioridad
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread_priority_expires_at
ON public.user_notifications (user_id, priority, expires_at)
WHERE status = 'unread';
```

---

## Pendiente — por área

### BLOQUE 1 — Error activo en infraestructura de BD

**TAREA 1A — Corregir `lib/supabase/pool.ts` (TS2345)**

Este archivo maneja connection pooling y tiene un error de tipo activo.

```bash
npm run type-check --workspace=apps/web 2>&1 | grep -A 3 "pool.ts"
```

Pasos:
1. Leer `lib/supabase/pool.ts` completamente
2. Identificar qué tipo está siendo pasado incorrectamente
3. Corregir el tipo sin cambiar la lógica de pooling
4. Agregar test mínimo que verifique que el pool se crea correctamente

---

### BLOQUE 2 — RLS Policies en tablas críticas

**TAREA 2A — Verificar y crear RLS en 6 tablas críticas**

Las siguientes tablas manejan datos sensibles y deben tener RLS habilitado:

| Tabla | Dato sensible | Policy requerida |
|---|---|---|
| `usuarios` | Datos personales | Usuario solo ve su propio registro |
| `lia_conversations` | Conversaciones con AI | Usuario solo ve las suyas |
| `study_sessions` | Hábitos de estudio | Usuario solo ve las suyas |
| `calendar_integrations` | Tokens OAuth | Usuario solo ve las suyas |
| `organization_users` | Membresía a org | Admin org o propio usuario |
| `user_lesson_progress` | Progreso educativo | Usuario o admin org |

Verificación actual:
```sql
-- En Supabase Studio o psql:
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**TAREA 2B — Crear migración para RLS faltante**

Patrón de migración (una por tabla que no tenga RLS):
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_rls_[tabla].sql
ALTER TABLE [tabla] ENABLE ROW LEVEL SECURITY;

-- Lectura: usuario solo ve sus registros
CREATE POLICY "[tabla]_select_own"
ON [tabla] FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Inserción: usuario solo inserta sus registros
CREATE POLICY "[tabla]_insert_own"
ON [tabla] FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
```

> No borrar policies existentes — solo agregar las que falten.

---

### BLOQUE 3 — Índices pendientes (segunda ronda)

Los 4 índices creados en la migración `20260402...` cubren los casos más críticos.
Índices adicionales probablemente faltantes:

```sql
-- lia_conversations por usuario (queries frecuentes en el chat)
CREATE INDEX IF NOT EXISTS idx_lia_conversations_user_id
ON lia_conversations(user_id, created_at DESC);

-- lia_messages por conversación
CREATE INDEX IF NOT EXISTS idx_lia_messages_conversation_id
ON lia_messages(conversation_id, created_at ASC);

-- user_lesson_progress por usuario y curso
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_course
ON user_lesson_progress(user_id, course_id);
```

Verificar que estas queries existen en el código antes de crear los índices:
```bash
grep -r "lia_conversations\|lia_messages" apps/web/src --include="*.ts" -l
grep -r "user_lesson_progress" apps/web/src --include="*.ts" -l
```

---

### BLOQUE 4 — Auditoría de migraciones

**TAREA 4A — Crear `supabase/MIGRATION_AUDIT.md`**

El directorio tiene 40+ migraciones. Identificar:
1. Migraciones que agregan columnas que luego se borran en otra migración
2. Tablas que ya no se usan en el código
3. Migraciones candidatas a consolidación

```bash
ls supabase/migrations/ | sort
```

**NO borrar migraciones existentes** — solo documentar candidatas a consolidar.

---

### BLOQUE 5 — Paginación cursor-based

**TAREA 5A — Migrar endpoint de notificaciones a cursor-based**

Actualmente usa offset/limit. Para listas grandes esto es ineficiente en páginas altas.

```typescript
// En vez de: .range(from, to)
// Usar: .gt('created_at', cursor).limit(pageSize).order('created_at')

// Response incluye:
{
  data: [...],
  nextCursor: data[data.length - 1]?.created_at ?? null,
  hasMore: data.length === pageSize
}
```

Candidatos (en orden de prioridad):
1. `GET /api/notifications` — puede crecer indefinidamente
2. `GET /api/study-planner/sessions` — historial de sesiones

---

## Reglas para Codex en este módulo

1. **Nunca modificar migraciones existentes.** Siempre crear una nueva migración.
2. **Cada migración = un archivo separado** con timestamp en el nombre (`YYYYMMDDHHMMSS_descripcion.sql`).
3. **RLS policies deben ser additive** — no borrar policies existentes.
4. **Los índices deben tener `IF NOT EXISTS`** para que sean idempotentes.
5. **Documentar cada índice** con el servicio/query que lo justifica.
6. **No agregar índices especulativos** — solo para queries que existen en el código.
7. **Verificar con `supabase db push --dry-run`** antes de aplicar migraciones.

## Verificación

```bash
# Verificar que las migraciones son válidas
supabase db push --dry-run

# Verificar los índices creados en la migración más reciente
grep -r "idx_" supabase/migrations/ --include="*.sql" | tail -20

# Type check de infraestructura BD
npm run type-check --workspace=apps/web 2>&1 | grep -E "pool|supabase"
```

## Métrica de éxito

- `lib/supabase/pool.ts` sin errores TS
- RLS habilitado y verificado en las 6 tablas críticas
- Índices adicionales creados para `lia_conversations` y `user_lesson_progress`
- Documento `supabase/MIGRATION_AUDIT.md` creado
- Al menos 1 endpoint migrado a cursor-based pagination
- TDI BD: de ~40% a ~25%
