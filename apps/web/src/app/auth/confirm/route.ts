import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import {
  type EmailConfirmationOtpType,
  verifyEmailConfirmation,
} from '@/features/auth/services/email-verification.service'
import { getEmailAppUrl } from '@/features/auth/services/email.utils'

const ALLOWED_EMAIL_OTP_TYPES = new Set<EmailConfirmationOtpType>([
  'email',
  'signup',
])

function redirectToAuth(status: 'invalid' | 'verified') {
  const destination = new URL('/auth', getEmailAppUrl())
  if (status === 'verified') {
    destination.searchParams.set('emailVerified', '1')
  } else {
    destination.searchParams.set('emailVerification', 'invalid')
  }

  const response = NextResponse.redirect(destination, 303)
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  return response
}

/**
 * Callback para plantillas Supabase que usan TokenHash:
 * /auth/confirm?token_hash={{ .TokenHash }}&type=email
 */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash')?.trim()
  const requestedType = request.nextUrl.searchParams.get('type')

  if (
    !tokenHash ||
    !requestedType ||
    !ALLOWED_EMAIL_OTP_TYPES.has(requestedType as EmailConfirmationOtpType)
  ) {
    return redirectToAuth('invalid')
  }

  try {
    await verifyEmailConfirmation({
      tokenHash,
      type: requestedType as EmailConfirmationOtpType,
    })
    return redirectToAuth('verified')
  } catch (error) {
    logger.warn('Email confirmation callback rejected', {
      code:
        error instanceof Error && 'code' in error
          ? String(error.code)
          : 'UNEXPECTED_ERROR',
    })
    return redirectToAuth('invalid')
  }
}
