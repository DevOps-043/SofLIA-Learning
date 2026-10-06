const INDIVIDUAL_INVITATION_TOKEN_PATTERN = /^[a-f0-9]{64}$/i
const BULK_INVITATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,128}$/

interface SearchParamsReader {
  get(name: string): string | null
}

export interface OrganizationRegistrationInvitationParams {
  bulkInviteToken: string | null
  hasInvalidToken: boolean
  invitationToken: string | null
}

/**
 * Resolves canonical and legacy invitation query parameters without allowing
 * arbitrary path characters to reach invitation API routes.
 *
 * Historical bulk links used `invite`; current links use `bulk_token`.
 * Individual invitations use 64-character hexadecimal bearer tokens.
 */
export function resolveOrganizationRegistrationInvitationParams(
  searchParams: SearchParamsReader | null,
): OrganizationRegistrationInvitationParams {
  if (!searchParams) {
    return {
      bulkInviteToken: null,
      hasInvalidToken: false,
      invitationToken: null,
    }
  }

  const rawIndividualToken =
    readTrimmed(searchParams, 'token') ??
    readTrimmed(searchParams, 'invitation_token')
  const rawBulkToken =
    readTrimmed(searchParams, 'bulk_token') ??
    readTrimmed(searchParams, 'invite')

  const invitationToken = rawIndividualToken
    ? validateToken(rawIndividualToken, INDIVIDUAL_INVITATION_TOKEN_PATTERN)
    : null
  const bulkInviteToken = rawBulkToken
    ? validateToken(rawBulkToken, BULK_INVITATION_TOKEN_PATTERN)
    : null

  return {
    bulkInviteToken,
    hasInvalidToken:
      Boolean(rawIndividualToken && !invitationToken) ||
      Boolean(rawBulkToken && !bulkInviteToken),
    invitationToken,
  }
}

function readTrimmed(searchParams: SearchParamsReader, key: string) {
  const value = searchParams.get(key)?.trim()
  return value || null
}

function validateToken(value: string, pattern: RegExp) {
  return pattern.test(value) ? value : null
}
