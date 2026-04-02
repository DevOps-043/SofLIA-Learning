import { logger } from '../../../../lib/logger';
import type {
  OAuthBulkInviteLinkContext,
  OAuthOrganizationContext,
  ResolvedOAuthInvitationContext,
  SupabaseServerClient,
} from './oauth-flow.types';

interface UserInvitationRow {
  email?: string | null;
  expires_at: string;
  id: string;
  metadata?: unknown;
  organization_id: string;
  organizations?: unknown;
  role: string;
  status: string;
}

interface PendingInvitationLookupRow {
  metadata?: unknown;
  organization_id: string;
  organizations?: unknown;
  role: string;
}

interface BulkInviteLinkRow {
  current_uses?: number | null;
  expires_at?: string | null;
  id: string;
  max_uses?: number | null;
  organization_id: string;
  role?: string | null;
  status: string;
}

interface OrganizationRelation {
  slug?: string | null;
}

interface ResolveOAuthInvitationContextInput {
  email: string;
  orgContext: OAuthOrganizationContext;
  providerLabel: string;
  supabase: SupabaseServerClient;
}

interface LinkOAuthUserToOrganizationInput {
  bulkInviteLink?: OAuthBulkInviteLinkContext;
  email: string;
  invitedPosition?: string;
  invitedRole?: string;
  orgContext: OAuthOrganizationContext;
  supabase: SupabaseServerClient;
  userId: string;
}

function getMetadataPosition(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }

  const value = (metadata as { position?: unknown }).position;

  return typeof value === 'string' ? value : undefined;
}

function getOrganizationSlug(organization: unknown): string | undefined {
  if (!organization || typeof organization !== 'object') {
    return undefined;
  }

  const relation = organization as OrganizationRelation;

  return typeof relation.slug === 'string' ? relation.slug : undefined;
}

function isExpired(dateValue?: string | null): boolean {
  if (!dateValue) {
    return false;
  }

  return new Date(dateValue) < new Date();
}

async function markInvitationExpired(
  supabase: SupabaseServerClient,
  invitationId: string
): Promise<void> {
  await supabase
    .from('user_invitations')
    .update({ status: 'expired' })
    .eq('id', invitationId);
}

async function resolveBulkInviteContext({
  orgContext,
  providerLabel,
  supabase,
}: Omit<ResolveOAuthInvitationContextInput, 'email'>): Promise<{
  error?: string;
  value?: Pick<
    ResolvedOAuthInvitationContext,
    'bulkInviteLink' | 'invitedRole'
  >;
}> {
  const { data: bulkInviteLink, error } = await supabase
    .from('bulk_invite_links')
    .select('id, organization_id, role, status, expires_at, max_uses, current_uses')
    .eq('token', orgContext.bulkToken)
    .maybeSingle();

  const link = bulkInviteLink as BulkInviteLinkRow | null;

  if (error || !link) {
    logger.error(`${providerLabel} OAuth: Enlace de invitacion no encontrado`, error);
    return { error: 'Enlace de invitacion invalido o no encontrado' };
  }

  if (link.organization_id !== orgContext.orgId) {
    return { error: 'Este enlace de invitacion no es para esta organizacion' };
  }

  if (link.status !== 'active') {
    if (link.status === 'paused') {
      return { error: 'Este enlace de invitacion esta pausado' };
    }

    if (link.status === 'expired') {
      return { error: 'Este enlace de invitacion ha expirado' };
    }

    if (link.status === 'exhausted') {
      return { error: 'Este enlace de invitacion ha alcanzado el limite de usos' };
    }

    return { error: 'Este enlace de invitacion no esta activo' };
  }

  if (isExpired(link.expires_at)) {
    return { error: 'Este enlace de invitacion ha expirado' };
  }

  if (link.max_uses && (link.current_uses || 0) >= link.max_uses) {
    return { error: 'Este enlace de invitacion ha alcanzado el limite de usos' };
  }

  return {
    value: {
      bulkInviteLink: {
        currentUses: link.current_uses || 0,
        id: link.id,
        organizationId: link.organization_id,
        role: link.role || 'member',
      },
      invitedRole: link.role || 'member',
    },
  };
}

async function resolveTokenInvitationContext({
  email,
  orgContext,
  providerLabel,
  supabase,
}: ResolveOAuthInvitationContextInput): Promise<{
  error?: string;
  value?: Pick<
    ResolvedOAuthInvitationContext,
    'invitedPosition' | 'invitedRole'
  >;
}> {
  const { data: invitation, error } = await supabase
    .from('user_invitations')
    .select('id, email, role, status, expires_at, organization_id, metadata')
    .eq('token', orgContext.invToken)
    .maybeSingle();

  const record = invitation as UserInvitationRow | null;

  if (error || !record) {
    logger.error(`${providerLabel} OAuth: Invitacion invalida`, error);
    return { error: 'Invitacion invalida o expirada' };
  }

  if (record.status !== 'pending') {
    return { error: 'Invitacion invalida o expirada' };
  }

  if (isExpired(record.expires_at)) {
    await markInvitationExpired(supabase, record.id);
    return { error: 'Esta invitacion ha expirado' };
  }

  if (record.email?.toLowerCase() !== email.toLowerCase()) {
    return { error: 'El email de tu cuenta no coincide con la invitacion' };
  }

  if (record.organization_id !== orgContext.orgId) {
    return { error: 'Esta invitacion no es para esta organizacion' };
  }

  return {
    value: {
      invitedPosition: getMetadataPosition(record.metadata),
      invitedRole: record.role,
    },
  };
}

async function resolveEmailInvitationContext({
  email,
  orgContext,
  providerLabel,
  supabase,
}: ResolveOAuthInvitationContextInput): Promise<{
  error?: string;
  value?: Pick<
    ResolvedOAuthInvitationContext,
    'invitedPosition' | 'invitedRole'
  >;
}> {
  const { data: invitation } = await supabase
    .from('user_invitations')
    .select('id, role, expires_at, metadata')
    .ilike('email', email.trim())
    .eq('organization_id', orgContext.orgId)
    .eq('status', 'pending')
    .maybeSingle();

  const record = invitation as Pick<
    UserInvitationRow,
    'expires_at' | 'id' | 'metadata' | 'role'
  > | null;

  if (!record) {
    logger.error(`${providerLabel} OAuth: Email no invitado a la organizacion`);
    return {
      error:
        'Tu correo no ha sido invitado a esta organizacion. Contacta al administrador para solicitar una invitacion.',
    };
  }

  if (isExpired(record.expires_at)) {
    await markInvitationExpired(supabase, record.id);
    return { error: 'La invitacion ha expirado' };
  }

  return {
    value: {
      invitedPosition: getMetadataPosition(record.metadata),
      invitedRole: record.role,
    },
  };
}

async function findPendingInvitationForGlobalLogin(
  supabase: SupabaseServerClient,
  email: string
): Promise<ResolvedOAuthInvitationContext> {
  const { data: invitations } = await supabase
    .from('user_invitations')
    .select('organization_id, role, metadata, organizations(slug), expires_at, id')
    .ilike('email', email.trim())
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1);

  const invitation = invitations?.[0] as
    | (PendingInvitationLookupRow &
        Pick<UserInvitationRow, 'expires_at' | 'id'>)
    | undefined;

  if (!invitation) {
    return { orgContext: {} };
  }

  if (isExpired(invitation.expires_at)) {
    await markInvitationExpired(supabase, invitation.id);
    return { orgContext: {} };
  }

  return {
    invitedPosition: getMetadataPosition(invitation.metadata),
    invitedRole: invitation.role,
    orgContext: {
      orgId: invitation.organization_id,
      orgSlug: getOrganizationSlug(invitation.organizations),
    },
  };
}

async function consumeInvitation(
  supabase: SupabaseServerClient,
  tokenOrEmail: string,
  organizationId: string
): Promise<void> {
  const isToken = tokenOrEmail.length === 64 && /^[a-f0-9]+$/i.test(tokenOrEmail);
  let query = supabase
    .from('user_invitations')
    .update({
      accepted_at: new Date().toISOString(),
      status: 'accepted',
    })
    .eq('organization_id', organizationId)
    .eq('status', 'pending');

  query = isToken
    ? query.eq('token', tokenOrEmail)
    : query.ilike('email', tokenOrEmail.trim());

  await query;
}

export async function resolveOAuthInvitationContext({
  email,
  orgContext,
  providerLabel,
  supabase,
}: ResolveOAuthInvitationContextInput): Promise<{
  error?: string;
  value?: ResolvedOAuthInvitationContext;
}> {
  if (!orgContext.orgId) {
    return {
      value: await findPendingInvitationForGlobalLogin(supabase, email),
    };
  }

  if (orgContext.bulkToken) {
    const bulkResult = await resolveBulkInviteContext({
      orgContext,
      providerLabel,
      supabase,
    });

    if (bulkResult.error || !bulkResult.value) {
      return { error: bulkResult.error };
    }

    return {
      value: {
        orgContext,
        ...bulkResult.value,
      },
    };
  }

  if (orgContext.invToken) {
    const tokenResult = await resolveTokenInvitationContext({
      email,
      orgContext,
      providerLabel,
      supabase,
    });

    if (tokenResult.error || !tokenResult.value) {
      return { error: tokenResult.error };
    }

    return {
      value: {
        orgContext,
        ...tokenResult.value,
      },
    };
  }

  const emailResult = await resolveEmailInvitationContext({
    email,
    orgContext,
    providerLabel,
    supabase,
  });

  if (emailResult.error || !emailResult.value) {
    return { error: emailResult.error };
  }

  return {
    value: {
      orgContext,
      ...emailResult.value,
    },
  };
}

export async function linkOAuthUserToOrganization({
  bulkInviteLink,
  email,
  invitedPosition,
  invitedRole,
  orgContext,
  supabase,
  userId,
}: LinkOAuthUserToOrganizationInput): Promise<void> {
  if (!orgContext.orgId) {
    return;
  }

  const { data: membership } = await supabase
    .from('organization_users')
    .select('id')
    .eq('organization_id', orgContext.orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (membership) {
    return;
  }

  const { error: insertError } = await supabase.from('organization_users').insert({
    organization_id: orgContext.orgId,
    job_title: invitedPosition || 'Miembro',
    joined_at: new Date().toISOString(),
    role: invitedRole || 'member',
    status: 'active',
    user_id: userId,
  });

  if (insertError) {
    throw new Error('No se pudo vincular el usuario a la organizacion');
  }

  if (bulkInviteLink) {
    await supabase.from('bulk_invite_registrations').insert({
      bulk_invite_link_id: bulkInviteLink.id,
      registered_at: new Date().toISOString(),
      user_id: userId,
    });

    await supabase
      .from('bulk_invite_links')
      .update({ current_uses: bulkInviteLink.currentUses + 1 })
      .eq('id', bulkInviteLink.id);

    return;
  }

  await consumeInvitation(
    supabase,
    orgContext.invToken || email,
    orgContext.orgId
  );
}
