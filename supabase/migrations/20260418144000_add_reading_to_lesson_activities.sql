begin;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel
      on rel.oid = con.conrelid
    join pg_namespace nsp
      on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'lesson_activities'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) like '%activity_type%'
  loop
    execute format(
      'alter table public.lesson_activities drop constraint if exists %I',
      constraint_name
    );
  end loop;
end $$;

alter table public.lesson_activities
  add constraint lesson_activities_activity_type_check
  check (
    activity_type in (
      'reflection',
      'exercise',
      'quiz',
      'discussion',
      'ai_chat',
      'reading'
    )
  );

commit;
