# CODEX TASK — Base de Datos (Supabase / PostgreSQL)

**Peso en TDI:** 10% | **Deuda residual estimada:** ~55-58%
**Fecha de corte:** 2026-04-01
**Estado:** Sin intervención en todo el programa de refactorización. Aporta 5.8pp de piso
mínimo al TDI que no puede reducirse sin trabajo directo en esta área.

---

## Lo que ya está hecho

- `lib/supabase/server.ts` — cliente stateless (sin cache global) ✅
- `lib/supabase/looseQuery.ts` — abstracción para tablas/vistas fuera de `types.ts` ✅
- Algunos N+1 eliminados en queries de communities y course detail ✅
- Schema completo en `lib/supabase/types.ts` (generado automáticamente) ✅
- 40+ migraciones en `supabase/migrations/`

**Lo que NO se ha hecho:**
- Sin análisis de índices
- Sin migraciones de limpieza/consolidación
- Sin RLS policies verificadas programáticamente
- `lib/supabase/pool.ts` tiene error TS2345 activo
- Sin paginación cursor-based en ningún dominio

---

## Pendiente — por área

### BLOQUE 1 — Errores activos en infraestructura de BD

**TAREA 1A — Corregir `lib/supabase/pool.ts` (TS2345)**

Este archivo maneja connection pooling y tiene un error de tipo activo.

```bash
# Ver el error exacto
npm run type-check --workspace=apps/web 2>&1 | grep -A 3 "pool.ts"
```

Pasos:
1. Leer `lib/supabase/pool.ts` completamente
2. Identificar qué tipo está siendo pasado incorrectamente
3. Corregir el tipo sin cambiar la lógica de pooling
4. Agregar test mínimo que verifique que el pool se crea correctamente

```
lib/supabase/__tests__/
└── pool.test.ts   # verificar creación y reutilización del cliente
```

---

### BLOQUE 2 — Migraciones y schema drift

**TAREA 2A — Auditoría de migraciones acumuladas**

El directorio `supabase/migrations/` tiene 40+ archivos. Muchas migraciones tempranas
pueden estar obsoletas o ser candidatas a consolidación.

```bash
# Listar migraciones ordenadas
ls -la supabase/migrations/ | sort
```

Acciones:
1. Identificar migraciones que agregan columnas que luego se borran en otra migración
2. Identificar tablas que ya no se usan en el código (`grep -r "nombre_tabla" apps/web/src`)
3. Crear documento `supabase/MIGRATION_AUDIT.md` con el resultado
4. **NO borrar migraciones existentes** — solo documentar las candidatas a consolidar

**TAREA 2B — Sincronizar `lib/supabase/looseQuery.ts` con tipos generados**

Algunas tablas/vistas están en `looseQuery.ts` porque no están en los tipos generados.
Verificar cuáles ya deberían estar en `lib/supabase/types.ts`:

```bash
# Ver qué tablas usa looseQuery
cat apps/web/src/lib/supabase/looseQuery.ts
```

Si alguna tabla en `looseQuery.ts` ya existe en `types.ts`, migrarla a los tipos generados.

---

### BLOQUE 3 — RLS Policies

**TAREA 3A — Verificar RLS en tablas críticas**

Las siguientes tablas manejan datos sensibles y deben tener RLS habilitado y correctamente configurado:

| Tabla | Dato sensible | RLS requerido |
|---|---|---|
| `usuarios` | Datos personales | Sí — usuario solo ve su propio registro |
| `lia_conversations` | Conversaciones con AI | Sí — usuario solo ve las suyas |
| `study_sessions` | Hábitos de estudio | Sí — usuario solo ve las suyas |
| `calendar_integrations` | Tokens OAuth | Sí — usuario solo ve las suyas |
| `organization_users` | Membresía a org | Sí — admin org o propio usuario |
| `user_lesson_progress` | Progreso educativo | Sí — usuario o admin org |

Verificación:
```sql
-- En Supabase Studio o psql:
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Para cada tabla sin RLS en la lista de arriba: crear migración que habilite RLS
y agregue las policies correspondientes.

**TAREA 3B — Crear migration para RLS faltante**

Patrón de migración:
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_rls_[tabla].sql
ALTER TABLE [tabla] ENABLE ROW LEVEL SECURITY;

-- Policy de lectura: usuario solo ve sus registros
CREATE POLICY "[tabla]_select_own"
ON [tabla] FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy de inserción: usuario solo inserta sus registros
CREATE POLICY "[tabla]_insert_own"
ON [tabla] FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
```

---

### BLOQUE 4 — Índices en queries críticas

**TAREA 4A — Identificar queries sin índice**

Las siguientes queries son candidatas a tener índices faltantes basado en los filtros
que usan los servicios del frontend:

```sql
-- Verificar índices existentes en tablas principales
SELECT
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'study_sessions',
    'user_lesson_progress',
    'lia_conversations',
    'calendar_integrations',
    'notification'  -- o como se llame la tabla
)
ORDER BY tablename, indexname;
```

Índices probablemente faltantes:
```sql
-- study_sessions por usuario (filtro más frecuente)
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id
ON study_sessions(user_id);

-- study_sessions por fecha (filtros de rango en el planner)
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date
ON study_sessions(user_id, scheduled_date);

-- lia_conversations por usuario
CREATE INDEX IF NOT EXISTS idx_lia_conversations_user_id
ON lia_conversations(user_id);

-- calendar_integrations por usuario y provider
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user_provider
ON calendar_integrations(user_id, provider);
```

**TAREA 4B — Crear migración con índices**

```
supabase/migrations/YYYYMMDDHHMMSS_performance_indexes.sql
```

Solo crear índices que se puedan verificar que se usan en el código.
Documentar cada índice con el servicio que genera la query.

---

### BLOQUE 5 — Paginación cursor-based

**TAREA 5A — Migrar endpoints de alto volumen a cursor-based pagination**

Actualmente todo usa offset/limit. Para listas grandes (notificaciones, sesiones) esto
es ineficiente en páginas altas.

Candidatos prioritarios:
1. `GET /api/notifications` — puede crecer indefinidamente
2. `GET /api/study-planner/sessions` — sesiones históricas

Patrón cursor-based con Supabase:
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

---

## Reglas para Codex en este módulo

1. **Nunca modificar migraciones existentes.** Siempre crear una nueva migración.
2. **Cada migración = un archivo separado** con timestamp en el nombre.
3. **RLS policies deben ser additive** — no borrar policies existentes.
4. **Verificar con `supabase db push --dry-run`** antes de aplicar migraciones.
5. **Los índices deben tener `IF NOT EXISTS`** para que sean idempotentes.
6. **Documentar cada índice** con el servicio/query que lo justifica.
7. **No agregar índices especulativos** — solo para queries que existen en el código.

## Verificación

```bash
# Verificar que las migraciones son válidas
supabase db push --dry-run

# Verificar RLS habilitado
# (En Supabase Studio: Database > Tables > verificar el ícono de candado)

# Type check de infraestructura BD
npm run type-check --workspace=apps/web 2>&1 | grep -E "pool|supabase"
```

## Métrica de éxito

- `lib/supabase/pool.ts` sin errores TS
- RLS habilitado en las 6 tablas críticas listadas
- Índices creados para queries de `study_sessions` y `calendar_integrations`
- Documento `supabase/MIGRATION_AUDIT.md` creado
- Al menos 1 endpoint migrado a cursor-based pagination
