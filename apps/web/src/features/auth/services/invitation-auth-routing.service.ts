export function getExistingAccountInvitationLoginPath(params: {
  accountExists?: boolean
  organizationSlug: string
  token?: string | null
}): string | null {
  if (!params.accountExists || !params.token) {
    return null
  }

  const searchParams = new URLSearchParams({
    invitation_token: params.token,
  })

  return `/auth/${encodeURIComponent(params.organizationSlug)}?${searchParams.toString()}`
}
