-- Permite editar los apuntes generados por SofLIA sin que el worker de
-- generación los sobrescriba después.
--
-- Cuando un usuario edita una auto-nota de lección, el servidor marca
-- is_user_edited = true. El worker (lesson-auto-note.service /
-- notebook-generation.processor) salta cualquier apunte marcado, preservando
-- las ediciones del usuario. Aditiva y reversible.

begin;

alter table public.user_lesson_notes
  add column if not exists is_user_edited boolean not null default false;

comment on column public.user_lesson_notes.is_user_edited is
  'True cuando el usuario editó manualmente un apunte generado por SofLIA; el worker de generación no lo vuelve a sobrescribir.';

-- Índice parcial para que el worker filtre rápido los apuntes protegidos.
create index if not exists idx_user_lesson_notes_user_edited
  on public.user_lesson_notes (user_id, enrollment_id, lesson_id)
  where is_user_edited = true;

commit;
