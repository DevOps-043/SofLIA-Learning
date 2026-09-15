begin;

-- Organization purchases are server-managed. Keeping mutation privileges away
-- from browser roles prevents a client from granting its own course access.
revoke insert, update, delete, truncate, references, trigger
  on table public.organization_course_purchases
  from public, anon, authenticated;
grant select, insert, update, delete
  on table public.organization_course_purchases
  to service_role;

create or replace function public.guard_organization_course_purchase()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $function$
declare
  billing_period_end timestamptz;
  billing_period_start timestamptz;
  current_period_count integer;
begin
  if new.access_status <> 'active' then
    return new;
  end if;

  -- Serialize purchases for one organization. This closes both the duplicate
  -- course and monthly-limit races without modifying historical rows.
  perform pg_advisory_xact_lock(
    hashtextextended('organization-course-purchase:' || new.organization_id::text, 0)
  );

  if exists (
    select 1
    from public.organization_course_purchases existing_purchase
    where existing_purchase.organization_id = new.organization_id
      and existing_purchase.course_id = new.course_id
      and existing_purchase.access_status = 'active'
      and existing_purchase.purchase_id <> new.purchase_id
  ) then
    raise exception using
      errcode = '23505',
      message = 'organization_course_already_active';
  end if;

  if new.purchase_method = 'subscription_benefit' then
    begin
      billing_period_start := nullif(
        new.metadata ->> 'billing_period_start',
        ''
      )::timestamptz;
      billing_period_end := nullif(
        new.metadata ->> 'billing_period_end',
        ''
      )::timestamptz;
    exception when invalid_datetime_format then
      raise exception using
        errcode = '23514',
        message = 'invalid_subscription_billing_period';
    end;

    if billing_period_start is null
      or billing_period_end is null
      or billing_period_start >= billing_period_end
    then
      raise exception using
        errcode = '23514',
        message = 'invalid_subscription_billing_period';
    end if;

    select count(*)::integer
    into current_period_count
    from public.organization_course_purchases period_purchase
    where period_purchase.organization_id = new.organization_id
      and period_purchase.access_status = 'active'
      and period_purchase.purchased_at >= billing_period_start
      and period_purchase.purchased_at < billing_period_end
      and period_purchase.purchase_id <> new.purchase_id;

    if current_period_count >= 10 then
      raise exception using
        errcode = '23514',
        message = 'organization_course_period_limit_reached';
    end if;
  end if;

  return new;
end;
$function$;

revoke all on function public.guard_organization_course_purchase() from public;

drop trigger if exists guard_organization_course_purchase_trigger
  on public.organization_course_purchases;
create trigger guard_organization_course_purchase_trigger
before insert or update of organization_id, course_id, access_status,
  purchase_method, metadata, purchased_at
on public.organization_course_purchases
for each row execute function public.guard_organization_course_purchase();

commit;
