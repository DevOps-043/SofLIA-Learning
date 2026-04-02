import type {
  InvitationRole as SchemaInvitationRole,
  InvitationStatus as SchemaInvitationStatus,
} from './schemas'

export type InvitationRole = SchemaInvitationRole
export type InvitationStatus = SchemaInvitationStatus

export interface InviteUserInput {
  email: string
  role?: InvitationRole
  organizationId: string
  customMessage?: string
  position?: string
}

export type InviteUserActionInput = InviteUserInput | FormData

export interface InviteResult {
  success: boolean
  error?: string
  invitationId?: string
}

export interface ValidateResult {
  valid: boolean
  email?: string
  role?: string
  position?: string
  organizationId?: string
  organizationName?: string
  organizationSlug?: string
  error?: string
}

export interface BulkInviteValidationResult {
  valid: boolean
  role?: string
  error?: string
}

export interface ConsumeResult {
  success: boolean
  error?: string
}

export interface BulkInviteConsumeResult extends ConsumeResult {
  organizationSlug?: string
}

export interface FindInvitationResult {
  hasInvitation: boolean
  role?: string
  position?: string
  error?: string
}

export interface OrganizationInvitationListItem {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  expires_at: string
  metadata: UserInvitationMetadata | null
}

export interface ListOrganizationInvitationsResult {
  success: boolean
  invitations?: OrganizationInvitationListItem[]
  error?: string
}

export interface UserRow {
  id: string
  cargo_rol?: string | null
}

export interface OrganizationRow {
  id?: string
  name?: string | null
  slug?: string | null
  logo_url?: string | null
}

export interface OrganizationUserRow {
  id: string
}

export interface OrganizationUserWrite {
  organization_id: string
  user_id: string
  role: string
  status: string
  joined_at: string
}

export interface UserRecord {
  id: string
  cargoRol?: string | null
}

export interface OrganizationSummary {
  id?: string
  name?: string | null
  slug?: string | null
  logoUrl?: string | null
}

export interface OrganizationMembershipRecord {
  id: string
}

export interface UserInvitationMetadata {
  position?: string | null
  custom_message?: string | null
}

export interface UserInvitationRow {
  id: string
  email: string
  token: string
  role: string
  status: InvitationStatus | string
  expires_at: string
  organization_id: string
  metadata: UserInvitationMetadata | null
  created_at: string | null
  organizations?: OrganizationRow | OrganizationRow[] | null
}

export interface UserInvitationWrite {
  accepted_at?: string
  email?: string
  expires_at?: string
  metadata?: UserInvitationMetadata | null
  organization_id?: string
  role?: string
  status?: string
  token?: string
}

export interface InvitationRecord {
  id: string
  email: string
  token: string
  role: string
  status: InvitationStatus | string
  expiresAt: string
  organizationId: string
  metadata: UserInvitationMetadata | null
  createdAt: string | null
  organization?: OrganizationSummary | null
}

export interface CreateInvitationInput {
  email: string
  token: string
  role: string
  organizationId: string
  expiresAt: string
  metadata: UserInvitationMetadata | null
}

export interface CreateOrganizationMembershipInput {
  organizationId: string
  userId: string
  role: string
  status: string
  joinedAt: string
}

export interface BulkInviteLinkRecord {
  id: string
  role: string | null
  maxUses: number | null
  currentUses: number | null
  expiresAt: string
  status: string
  organizationId: string
}

export interface BulkInviteLinkRow {
  id: string
  role: string | null
  max_uses: number | null
  current_uses: number | null
  expires_at: string
  status: string
  organization_id: string
}

export interface BulkInviteLinkWrite {
  current_uses?: number
  status?: string
}

export interface BulkInviteRegistrationWrite {
  bulk_invite_link_id: string
  user_id: string
}

export interface UserSessionRow {
  user_id: string
}

export interface RefreshTokenRow {
  user_id: string
}

export interface InvitationRepository {
  addOrganizationMembership(input: CreateOrganizationMembershipInput): Promise<void>
  acceptInvitation(invitationId: string, acceptedAt: string): Promise<void>
  createBulkInviteRegistration(linkId: string, userId: string): Promise<void>
  createInvitation(input: CreateInvitationInput): Promise<{ id: string }>
  findOrganizationMembership(
    userId: string,
    organizationId: string
  ): Promise<OrganizationMembershipRecord | null>
  findPendingInvitationByEmail(
    email: string,
    organizationId: string
  ): Promise<InvitationRecord | null>
  findUserByEmail(email: string): Promise<UserRecord | null>
  findUserById(userId: string): Promise<UserRecord | null>
  getBulkInviteLinkByToken(token: string): Promise<BulkInviteLinkRecord | null>
  getInvitationById(invitationId: string): Promise<InvitationRecord | null>
  getInvitationByToken(token: string): Promise<InvitationRecord | null>
  getInvitationForConsume(
    tokenOrEmail: string,
    organizationId: string,
    lookupByToken: boolean
  ): Promise<InvitationRecord | null>
  getOrganizationById(organizationId: string): Promise<OrganizationSummary | null>
  getOrganizationSlug(organizationId: string): Promise<string | null>
  listOrganizationInvitations(
    organizationId: string,
    status?: InvitationStatus
  ): Promise<InvitationRecord[]>
  markBulkInviteLinkStatus(linkId: string, status: string): Promise<void>
  markInvitationExpired(invitationId: string): Promise<void>
  refreshInvitation(
    invitationId: string,
    token: string,
    expiresAt: string
  ): Promise<void>
  resolveAuthenticatedUserId(): Promise<string | null>
  revokePendingInvitation(invitationId: string): Promise<void>
  reserveBulkInviteUse(
    linkId: string,
    expectedCurrentUses: number | null,
    nextUses: number,
    nextStatus?: string
  ): Promise<boolean>
  setUserBusinessRole(userId: string): Promise<void>
}

export interface InvitationLogger {
  error(message: string, ...metadata: unknown[]): void
  info(message: string, ...metadata: unknown[]): void
  warn(message: string, ...metadata: unknown[]): void
}

export interface InvitationEmailService {
  sendOrganizationInvitationEmail(
    email: string,
    token: string,
    organizationName: string,
    organizationSlug: string,
    customMessage?: string,
    organizationLogoUrl?: string
  ): Promise<unknown>
}

export interface InvitationRuntime {
  createToken: () => string
  emailService: InvitationEmailService
  logger: InvitationLogger
  now: () => Date
  repo: InvitationRepository
}
