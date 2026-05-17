import type {
  OAuthBulkInviteLinkContext,
  OAuthOrganizationContext,
  SupabaseServerClient,
} from '../oauth-flow.types';

export interface UserInvitationRow {
  email?: string | null;
  expires_at: string;
  id: string;
  metadata?: unknown;
  organization_id: string;
  organizations?: unknown;
  role: string;
  status: string;
}

export interface PendingInvitationLookupRow {
  metadata?: unknown;
  organization_id: string;
  organizations?: unknown;
  role: string;
}

export interface BulkInviteLinkRow {
  current_uses?: number | null;
  expires_at?: string | null;
  id: string;
  max_uses?: number | null;
  organization_id: string;
  role?: string | null;
  status: string;
}

export interface BulkInviteRegistrationInsert {
  bulk_invite_link_id: string;
  registered_at: string;
  user_id: string;
}

export interface OrganizationRelation {
  slug?: string | null;
}

export interface ExistingOrganizationMembershipRow {
  id: string;
  role?: string | null;
}

export interface ResolveOAuthInvitationContextInput {
  email: string;
  existingUserId?: string;
  orgContext: OAuthOrganizationContext;
  providerLabel: string;
  supabase: SupabaseServerClient;
}

export interface LinkOAuthUserToOrganizationInput {
  bulkInviteLink?: OAuthBulkInviteLinkContext;
  email: string;
  invitedPosition?: string;
  invitedRole?: string;
  orgContext: OAuthOrganizationContext;
  supabase: SupabaseServerClient;
  userId: string;
}
