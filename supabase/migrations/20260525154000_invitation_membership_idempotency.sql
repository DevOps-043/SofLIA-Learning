-- =============================================================================
-- Migration: invitation_membership_idempotency
-- Purpose:   Make invitation redemption idempotent under Supabase Auth flows.
--            These indexes prevent duplicate organization memberships and
--            duplicated bulk invite usage records for the same user.
-- =============================================================================

create unique index if not exists organization_users_org_user_unique_idx
  on public.organization_users (organization_id, user_id);

create unique index if not exists bulk_invite_registrations_link_user_unique_idx
  on public.bulk_invite_registrations (bulk_invite_link_id, user_id);

create unique index if not exists user_invitations_token_unique_idx
  on public.user_invitations (token);

create unique index if not exists user_invitations_pending_org_email_unique_idx
  on public.user_invitations (organization_id, lower(email))
  where status = 'pending';
