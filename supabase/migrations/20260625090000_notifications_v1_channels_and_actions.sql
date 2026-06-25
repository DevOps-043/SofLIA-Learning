begin;

alter table public.user_notifications
  add column if not exists dedup_key text;

create unique index if not exists idx_user_notifications_dedup_key
  on public.user_notifications (user_id, notification_type, dedup_key)
  where dedup_key is not null;

create index if not exists idx_user_notifications_status_created
  on public.user_notifications (user_id, status, created_at desc);

alter table public.user_notification_preferences
  add column if not exists whatsapp_enabled boolean default false;

create table if not exists public.notification_channel_deliveries (
  delivery_id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.user_notifications(notification_id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  channel text not null check (channel in ('email', 'push', 'sms', 'whatsapp')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  destination text,
  payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  next_attempt_at timestamptz not null default now(),
  sent_at timestamptz,
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_channel_deliveries_unique_channel
    unique (notification_id, channel)
);

create index if not exists idx_notification_channel_deliveries_pending
  on public.notification_channel_deliveries (status, next_attempt_at, created_at)
  where status in ('pending', 'failed');

create index if not exists idx_notification_channel_deliveries_user
  on public.notification_channel_deliveries (user_id, created_at desc);

alter table public.notification_channel_deliveries enable row level security;

drop policy if exists notification_channel_deliveries_service_role on public.notification_channel_deliveries;
create policy notification_channel_deliveries_service_role
  on public.notification_channel_deliveries
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.mark_notification_read(
  p_notification_id uuid,
  p_user_id uuid
)
returns table (
  notification_id uuid,
  status text,
  updated boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected_id uuid;
begin
  if p_notification_id is null or p_user_id is null then
    raise exception 'p_notification_id and p_user_id are required'
      using errcode = '22023';
  end if;

  if auth.role() <> 'service_role' and auth.uid() is distinct from p_user_id then
    raise exception 'Cannot update another user notification'
      using errcode = '42501';
  end if;

  update public.user_notifications notification
     set status = 'read',
         read_at = coalesce(notification.read_at, now()),
         updated_at = now()
   where notification.notification_id = p_notification_id
     and notification.user_id = p_user_id
     and notification.status <> 'read'
   returning notification.notification_id into affected_id;

  if affected_id is not null then
    return query select affected_id, 'read'::text, true;
    return;
  end if;

  return query
    select notification.notification_id, notification.status::text, false
      from public.user_notifications notification
     where notification.notification_id = p_notification_id
       and notification.user_id = p_user_id;
end;
$$;

create or replace function public.archive_notification(
  p_notification_id uuid,
  p_user_id uuid
)
returns table (
  notification_id uuid,
  status text,
  updated boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected_id uuid;
begin
  if p_notification_id is null or p_user_id is null then
    raise exception 'p_notification_id and p_user_id are required'
      using errcode = '22023';
  end if;

  if auth.role() <> 'service_role' and auth.uid() is distinct from p_user_id then
    raise exception 'Cannot update another user notification'
      using errcode = '42501';
  end if;

  update public.user_notifications notification
     set status = 'archived',
         updated_at = now()
   where notification.notification_id = p_notification_id
     and notification.user_id = p_user_id
     and notification.status <> 'archived'
   returning notification.notification_id into affected_id;

  if affected_id is not null then
    return query select affected_id, 'archived'::text, true;
    return;
  end if;

  return query
    select notification.notification_id, notification.status::text, false
      from public.user_notifications notification
     where notification.notification_id = p_notification_id
       and notification.user_id = p_user_id;
end;
$$;

create or replace function public.delete_notification(
  p_notification_id uuid,
  p_user_id uuid
)
returns table (
  notification_id uuid,
  deleted boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected_id uuid;
begin
  if p_notification_id is null or p_user_id is null then
    raise exception 'p_notification_id and p_user_id are required'
      using errcode = '22023';
  end if;

  if auth.role() <> 'service_role' and auth.uid() is distinct from p_user_id then
    raise exception 'Cannot delete another user notification'
      using errcode = '42501';
  end if;

  delete from public.user_notifications notification
   where notification.notification_id = p_notification_id
     and notification.user_id = p_user_id
   returning notification.notification_id into affected_id;

  if affected_id is not null then
    return query select affected_id, true;
    return;
  end if;

  return query select p_notification_id, false;
end;
$$;

create or replace function public.mark_all_notifications_read(p_user_id uuid)
returns table (updated_count bigint)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null then
    raise exception 'p_user_id is required'
      using errcode = '22023';
  end if;

  if auth.role() <> 'service_role' and auth.uid() is distinct from p_user_id then
    raise exception 'Cannot update another user notifications'
      using errcode = '42501';
  end if;

  return query
    with updated_rows as (
      update public.user_notifications notification
         set status = 'read',
             read_at = now(),
             updated_at = now()
       where notification.user_id = p_user_id
         and notification.status = 'unread'
         and (
           notification.expires_at is null
           or notification.expires_at > now()
         )
       returning notification.notification_id
    )
    select count(*)::bigint from updated_rows;
end;
$$;

revoke all on function public.mark_notification_read(uuid, uuid) from public;
revoke all on function public.archive_notification(uuid, uuid) from public;
revoke all on function public.delete_notification(uuid, uuid) from public;
revoke all on function public.mark_all_notifications_read(uuid) from public;

grant execute on function public.mark_notification_read(uuid, uuid) to authenticated, service_role;
grant execute on function public.archive_notification(uuid, uuid) to authenticated, service_role;
grant execute on function public.delete_notification(uuid, uuid) to authenticated, service_role;
grant execute on function public.mark_all_notifications_read(uuid) to authenticated, service_role;

commit;
