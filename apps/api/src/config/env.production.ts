import { containsWeakDefault } from './env.defaults'
import type { ParsedEnv } from './env.schema'

type ResolvedEnv = ReturnType<
  typeof import('./env.resolve')['resolveEnvConfig']
>

function assertStrongSecret(name: string, value: string, guidance: string) {
  if (!containsWeakDefault(value)) {
    return
  }

  throw new Error(
    `${name} usa un valor por defecto inseguro en produccion. ${guidance}`,
  )
}

export function validateProductionEnv(parsed: ParsedEnv, resolved: ResolvedEnv) {
  if (parsed.NODE_ENV !== 'production') {
    return
  }

  assertStrongSecret(
    'JWT_SECRET',
    resolved.JWT_SECRET,
    'Configura USER_JWT_SECRET con un valor aleatorio de al menos 32 caracteres.',
  )
  assertStrongSecret(
    'REFRESH_TOKEN_SECRET',
    resolved.REFRESH_TOKEN_SECRET,
    'Configura REFRESH_TOKEN_SECRET o API_SECRET_KEY con un valor seguro.',
  )
  assertStrongSecret(
    'SESSION_SECRET',
    resolved.SESSION_SECRET,
    'Configura SESSION_SECRET con un valor aleatorio de al menos 32 caracteres.',
  )

  if (
    containsWeakDefault(resolved.SUPABASE_URL) ||
    containsWeakDefault(resolved.SUPABASE_SERVICE_ROLE_KEY)
  ) {
    throw new Error(
      'Supabase usa valores por defecto en produccion. Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY correctamente.',
    )
  }

  if (!parsed.SUPABASE_JWT_SECRET && !parsed.USER_JWT_SECRET && !parsed.JWT_SECRET) {
    throw new Error(
      'SUPABASE_JWT_SECRET, USER_JWT_SECRET o JWT_SECRET es requerido en produccion',
    )
  }

  if (!parsed.SUPABASE_URL && !parsed.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error(
      'SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL es requerida en produccion',
    )
  }

  if (!parsed.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY es requerida en produccion')
  }
}
