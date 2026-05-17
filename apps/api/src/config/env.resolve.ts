import {
  DEFAULT_FILE_TYPES,
  DEFAULT_JWT_SECRET,
  DEFAULT_REFRESH_SECRET,
  DEFAULT_SESSION_SECRET,
  DEFAULT_SUPABASE_KEY,
  DEFAULT_SUPABASE_URL,
} from './env.defaults'
import type { ParsedEnv } from './env.schema'

export function resolveEnvConfig(parsed: ParsedEnv) {
  const jwtSecret =
    parsed.SUPABASE_JWT_SECRET ||
    parsed.USER_JWT_SECRET ||
    parsed.JWT_SECRET ||
    DEFAULT_JWT_SECRET

  const refreshSecret =
    parsed.REFRESH_TOKEN_SECRET || parsed.API_SECRET_KEY || DEFAULT_REFRESH_SECRET

  const supabaseUrl =
    parsed.SUPABASE_URL ||
    parsed.NEXT_PUBLIC_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL

  return {
    ...parsed,
    JWT_SECRET: jwtSecret,
    SUPABASE_JWT_SECRET: jwtSecret,
    REFRESH_TOKEN_SECRET: refreshSecret,
    SESSION_SECRET: parsed.SESSION_SECRET || DEFAULT_SESSION_SECRET,
    SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY:
      parsed.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SUPABASE_KEY,
    SUPABASE_ANON_KEY:
      parsed.SUPABASE_ANON_KEY || parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    ALLOWED_FILE_TYPES:
      parsed.ALLOWED_FILE_TYPES?.split(',').map((type) => type.trim()) ||
      DEFAULT_FILE_TYPES,
  } as const
}
