begin;

create or replace function public.get_unread_notifications_count(p_user_id uuid)
returns table (
  total bigint,
  critical bigint,
  high bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null then
    raise exception 'p_user_id is required'
      using errcode = '22023';
  end if;

  if auth.role() <> 'service_role' and auth.uid() is distinct from p_user_id then
    raise exception 'Cannot read unread notification counts for another user'
      using errcode = '42501';
  end if;

  return query
    select
      count(*)::bigint as total,
      count(*) filter (where notification.priority = 'critical')::bigint as critical,
      count(*) filter (where notification.priority = 'high')::bigint as high
    from public.user_notifications notification
    where notification.user_id = p_user_id
      and notification.status = 'unread'
      and (
        notification.expires_at is null
        or notification.expires_at > now()
      );
end;
$$;

revoke all on function public.get_unread_notifications_count(uuid) from public;
grant execute on function public.get_unread_notifications_count(uuid) to authenticated;
grant execute on function public.get_unread_notifications_count(uuid) to service_role;

comment on function public.get_unread_notifications_count(uuid) is
  'Returns unread notification counts for the authenticated user grouped by total, critical, and high priority.';

commit;
