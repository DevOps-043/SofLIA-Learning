-- Remove the SofLIA note regeneration cap and scope version uniqueness by organization.

alter table public.module_learning_summaries
  drop constraint if exists module_learning_summaries_version_check;

alter table public.module_learning_summaries
  add constraint module_learning_summaries_version_check check (version >= 1);

drop index if exists public.idx_module_learning_summaries_user_module_version;

create unique index if not exists idx_module_learning_summaries_user_module_org_version
  on public.module_learning_summaries(user_id, module_id, organization_id, version)
  where organization_id is not null;

create unique index if not exists idx_module_learning_summaries_user_module_no_org_version
  on public.module_learning_summaries(user_id, module_id, version)
  where organization_id is null;
