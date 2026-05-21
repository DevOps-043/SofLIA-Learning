export const AUTH_LOGIN_PATH = '/auth'

export function buildAuthLoginPath(error?: string): string {
  if (!error) {
    return AUTH_LOGIN_PATH
  }

  const params = new URLSearchParams({ error })
  return `${AUTH_LOGIN_PATH}?${params.toString()}`
}
