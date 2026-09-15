import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type EmailConfirmationOtpType = 'email' | 'signup'

export class EmailVerificationError extends Error {
  constructor(
    readonly code:
      | 'INVALID_OR_EXPIRED_TOKEN'
      | 'MISSING_CANONICAL_CONFIRMATION'
      | 'PROFILE_SYNC_FAILED',
    message: string,
  ) {
    super(message)
    this.name = 'EmailVerificationError'
  }
}

/**
 * Consume un token de confirmación emitido por Supabase y refleja el estado
 * canónico de auth.users en public.users. Nunca acepta un id o email enviados
 * por el navegador: ambos se derivan exclusivamente del token verificado.
 */
export async function verifyEmailConfirmation(input: {
  tokenHash: string
  type: EmailConfirmationOtpType
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: input.tokenHash,
    type: input.type,
  })

  if (error) {
    throw new EmailVerificationError('INVALID_OR_EXPIRED_TOKEN', error.message)
  }

  const userId = data.user?.id
  const confirmedAt = data.user?.email_confirmed_at
  if (!userId || !confirmedAt) {
    throw new EmailVerificationError(
      'MISSING_CANONICAL_CONFIRMATION',
      'Supabase Auth no devolvio una confirmacion canonica.',
    )
  }

  const { error: updateError } = await createAdminClient()
    .from('users')
    .update({
      email_verified: true,
      email_verified_at: confirmedAt,
    })
    .eq('id', userId)

  if (updateError) {
    throw new EmailVerificationError('PROFILE_SYNC_FAILED', updateError.message)
  }

  return { confirmedAt, userId }
}
