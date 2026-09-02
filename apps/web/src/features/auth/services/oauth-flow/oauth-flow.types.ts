import type { createAdminClient } from '../../../../lib/supabase/admin';
import type { createClient } from '../../../../lib/supabase/server';
import type {
  OAuthProvider,
  OAuthTokens,
} from '../../types/oauth.types';
import type { ServerAuthSession } from '../auth-session.service';

export type SupabaseServerClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>;

export interface OAuthInitParams {
  organizationId?: string;
  organizationSlug?: string;
  invitationToken?: string;
  bulkInviteToken?: string;
}

export interface OAuthOrganizationContext {
  orgId?: string;
  orgSlug?: string;
  invToken?: string;
  bulkToken?: string;
}

export interface NormalizedOAuthProfile {
  providerAccountId: string;
  email: string;
  /** False means the provider explicitly says it has not verified the email. */
  emailVerified?: boolean;
  fullName: string;
  firstName: string;
  lastName: string;
  picture?: string;
}

export interface OAuthBulkInviteLinkContext {
  id: string;
  organizationId: string;
  currentUses: number;
  role: string;
  token: string;
}

export interface ResolvedOAuthInvitationContext {
  orgContext: OAuthOrganizationContext;
  invitedRole?: string;
  invitedPosition?: string;
  bulkInviteLink?: OAuthBulkInviteLinkContext;
}

export interface OAuthProviderAdapter<TProviderTokens> {
  provider: OAuthProvider;
  providerLabel: string;
  shouldNotifyLoginSuccess?: boolean;
  exchangeCodeForTokens(code: string): Promise<TProviderTokens>;
  getProfile(tokens: TProviderTokens): Promise<NormalizedOAuthProfile>;
  toOAuthTokens(tokens: TProviderTokens): OAuthTokens;
}

export interface OAuthCallbackParamsLike {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export interface ProcessOAuthCallbackResult {
  destination?: string;
  error?: string;
  isNewUser?: boolean;
  session?: ServerAuthSession;
  /** Identidad resuelta; la usa el puente con el escritorio para emitir su ticket. */
  userId?: string;
}
