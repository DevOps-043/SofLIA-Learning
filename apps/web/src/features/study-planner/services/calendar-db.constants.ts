export const CALENDAR_INTEGRATION_PUBLIC_SELECT = `
  id,
  user_id,
  provider,
  access_token,
  expires_at,
  scope
`

export const CALENDAR_INTEGRATION_TOKEN_SELECT = `
  id,
  user_id,
  provider,
  access_token,
  refresh_token,
  expires_at,
  scope,
  metadata,
  updated_at
`
