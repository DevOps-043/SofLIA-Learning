export const DEFAULT_JWT_SECRET = 'dev-secret-key-change-in-production'
export const DEFAULT_REFRESH_SECRET = 'dev-refresh-secret'
export const DEFAULT_SESSION_SECRET = 'your-session-secret'
export const DEFAULT_SUPABASE_URL = 'https://dev-project.supabase.co'
export const DEFAULT_SUPABASE_KEY = 'dev-service-key'

export const DEFAULT_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'text/plain',
]

export const WEAK_DEFAULT_MARKERS = [
  'dev-secret-key',
  'dev-refresh-secret',
  'your-session-secret',
  'dev-service-key',
  'change-in-production',
  'dev-project.supabase.co',
]

export function containsWeakDefault(value: string) {
  const normalized = value.toLowerCase()
  return WEAK_DEFAULT_MARKERS.some((weak) => normalized.includes(weak))
}
