import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

import { apiError } from '@/lib/api/errors'
import { type AuthContext, normalizeAuthRole } from '@/lib/api/with-auth'
import {
  MfaError,
  verifyMfaToken,
  verifyMfaTokenForLogin,
} from '@/lib/auth/mfa/mfa.service'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/types'
import { recordSecurityEvent } from '@/lib/security/security-events'
import { updateLastLoginAt } from '@/features/auth/services/auth-session.service'
import { createLoginSessions } from '@/features/auth/actions/login/create-login-sessions'
import {
  buildLockoutErrorMessage,
  buildLoginAttemptContext,
  clearLoginLockout,
  getLoginLockoutStatus,
  recordFailedLoginAttempt,
} from '@/features/auth/actions/login/lockout'
import {
  buildFormDataFromLoginMfaChallenge,
  LOGIN_MFA_CHALLENGE_COOKIE_NAME,
  LoginMfaChallengeError,
  verifyLoginMfaChallenge,
} from '@/features/auth/actions/login/mfa-login-challenge'
import { validateCustomOrganizationLogin } from '@/features/auth/actions/login/organization-context'
import { resolveLoginRedirect } from '@/features/auth/actions/login/redirect'
import { findLoginUserById } from '@/features/auth/actions/login/user-credentials'

import { loginChallengeTokenSchema, tokenSchema } from '../schema'

type UserProfileRow = Pick<Tables<'users'>, 'cargo_rol' | 'email' | 'id'>

export async function POST(request: NextRequest) {
  const json = await readJsonBody(request)
  if (!json.ok) {
    return apiError('INVALID_JSON', 'El cuerpo de la solicitud no es JSON valido.', 400)
  }

  if (hasChallengeToken(json.body)) {
    const parsed = loginChallengeTokenSchema.safeParse(json.body)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'La solicitud no cumple el contrato esperado.', 422, {
        details: parsed.error.flatten(),
      })
    }

    return verifyLoginChallenge(request, parsed.data)
  }

  const parsed = tokenSchema.safeParse(json.body)
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'La solicitud no cumple el contrato esperado.', 422, {
      details: parsed.error.flatten(),
    })
  }

  const auth = await resolveAuthContext()
  if (auth instanceof Response) {
    return auth
  }

  try {
    const ok = await verifyMfaToken({ id: auth.userId, email: auth.email }, parsed.data.token)
    if (!ok) {
      return apiError('MFA_INVALID_TOKEN', 'Codigo MFA invalido o expirado.', 400)
    }
    return NextResponse.json({ verified: true })
  } catch (error) {
    if (error instanceof MfaError) {
      return apiError(error.code, error.message, 500)
    }
    return apiError('MFA_VERIFY_ERROR', 'Error al verificar MFA.', 500)
  }
}

async function verifyLoginChallenge(
  request: NextRequest,
  input: { challengeToken: string; token: string },
) {
  const cookieStore = await cookies()
  let challenge: ReturnType<typeof verifyLoginMfaChallenge>

  try {
    challenge = verifyLoginMfaChallenge({
      cookieNonce: cookieStore.get(LOGIN_MFA_CHALLENGE_COOKIE_NAME)?.value,
      headers: request.headers,
      token: input.challengeToken,
    })
  } catch (error) {
    const reason = error instanceof LoginMfaChallengeError
      ? error.code
      : 'invalid_challenge'

    cookieStore.delete(LOGIN_MFA_CHALLENGE_COOKIE_NAME)
    recordSecurityEvent('mfa-verification-failed', {
      method: request.method,
      pathname: request.nextUrl.pathname,
      metadata: { reason },
    })
    return apiError('MFA_CHALLENGE_INVALID', 'El reto MFA expiro o no es valido.', 401)
  }

  const loginAttemptContext = buildLoginAttemptContext(
    challenge.emailOrUsername,
    request.headers,
  )
  const currentLockout = await getLoginLockoutStatus(loginAttemptContext)
  if (currentLockout.isLocked) {
    return apiError('ACCOUNT_LOCKED', buildLockoutErrorMessage(currentLockout), 423)
  }

  const supabase = await createClient()
  const user = await findLoginUserById(supabase, challenge.userId)
  if (!user?.email || user.is_banned) {
    cookieStore.delete(LOGIN_MFA_CHALLENGE_COOKIE_NAME)
    return apiError('MFA_USER_NOT_FOUND', 'No se encontro el usuario del reto MFA.', 403)
  }

  try {
    const verified = await verifyMfaTokenForLogin(
      { id: user.id, email: user.email },
      input.token,
    )

    if (!verified) {
      const failedAttempt = await recordFailedLoginAttempt(loginAttemptContext)
      recordSecurityEvent('mfa-verification-failed', {
        actorId: user.id,
        actorRole: user.cargo_rol,
        method: request.method,
        pathname: request.nextUrl.pathname,
        metadata: { reason: 'invalid_token' },
      })
      return apiError(
        'MFA_INVALID_TOKEN',
        failedAttempt.isLocked
          ? buildLockoutErrorMessage(failedAttempt)
          : 'Codigo MFA invalido o expirado.',
        400,
      )
    }

    const organizationResult = await validateCustomOrganizationLogin({
      formData: buildFormDataFromLoginMfaChallenge(challenge),
      supabase,
      user,
    })
    if (organizationResult) {
      return NextResponse.json(organizationResult)
    }

    const sessionResult = await createLoginSessions({
      rememberMe: challenge.rememberMe,
      userId: user.id,
    })
    if (sessionResult) {
      return apiError('SESSION_CREATION_FAILED', sessionResult.error, 500)
    }

    await clearLoginLockout(loginAttemptContext)
    await updateLastLoginAt(supabase, user.id)
    cookieStore.delete(LOGIN_MFA_CHALLENGE_COOKIE_NAME)

    const redirectTo = await resolveLoginRedirect({ supabase, user })
    recordSecurityEvent('mfa-verification-success', {
      actorId: user.id,
      actorRole: user.cargo_rol,
      method: request.method,
      pathname: request.nextUrl.pathname,
    })
    recordSecurityEvent('login-success', {
      actorId: user.id,
      actorRole: user.cargo_rol,
      metadata: { mfaVerified: true },
    })

    return NextResponse.json({ redirectTo, success: true, verified: true })
  } catch (error) {
    if (error instanceof MfaError) {
      return apiError(error.code, error.message, 500)
    }
    return apiError('MFA_VERIFY_ERROR', 'Error al verificar MFA.', 500)
  }
}

async function resolveAuthContext(): Promise<AuthContext | Response> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return apiError('UNAUTHENTICATED', 'Debes iniciar sesion para continuar.', 401)
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('id, email, cargo_rol')
    .eq('id', user.id)
    .single<UserProfileRow>()

  if (error || !profile) {
    return apiError('PROFILE_NOT_FOUND', 'No se encontro el perfil del usuario autenticado.', 403)
  }

  const role = normalizeAuthRole(profile.cargo_rol)
  if (!role) {
    return apiError('FORBIDDEN', 'El rol del usuario no permite acceder a este recurso.', 403)
  }

  return {
    email: profile.email ?? user.email ?? '',
    role,
    userId: user.id,
  }
}

async function readJsonBody(
  request: NextRequest,
): Promise<{ body: unknown; ok: true } | { ok: false }> {
  try {
    return { body: await request.json(), ok: true }
  } catch {
    return { ok: false }
  }
}

function hasChallengeToken(body: unknown): boolean {
  return (
    typeof body === 'object' &&
    body !== null &&
    'challengeToken' in body
  )
}
