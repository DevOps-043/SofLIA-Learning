begin;

-- Alinear el esquema al contrato del codigo: una completion puede existir
-- sin conversacion asociada. El codigo en /api/lia/{start,complete,update}-activity
-- ya tipaba conversation_id como string | null desde su creacion, pero el
-- esquema introducido en NewBDStructure.sql lo declaro NOT NULL, generando
-- una regresion (error 23502) al marcar una activity ai_chat como completada
-- en el momento de abrir el chat (todavia no existe conversacion).
--
-- Casos validos para conversation_id NULL:
--   - Actividad ai_chat marcada como completada antes de iniciar dialogo.
--   - Actividades no-chat (reading, quiz interactivos) que registran completion.
--   - Conversacion eliminada posteriormente (preservamos la completion como
--     evidencia de progreso del usuario).
alter table public.lia_activity_completions
  alter column conversation_id drop not null;

-- Rollback:
--   1. Auditar nulls existentes:
--        select count(*) from public.lia_activity_completions
--        where conversation_id is null;
--   2. Decidir politica para esos registros (purga, backfill, etc.) antes del rollback.
--   3. Aplicar:
--        alter table public.lia_activity_completions
--          alter column conversation_id set not null;

commit;
