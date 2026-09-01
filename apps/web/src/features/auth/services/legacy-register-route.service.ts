const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,128}$/

export function getLegacyRegisterInvitePath(
  invite: string | string[] | undefined,
): string | null {
  if (typeof invite !== 'string') return null

  const token = invite.trim()
  if (!INVITE_TOKEN_PATTERN.test(token)) return null

  return `/invite/${encodeURIComponent(token)}`
}
