'use server'

import { createAuthActionClient } from '@/lib/supabase/auth-server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { cookies, headers } from 'next/headers'
import {
  getMfaStatusForLogin,
  MfaError,
} from '@/lib/auth/mfa/mfa.service'
import { requireHumanVerification } from '@/lib/security/bot-protection'
import { recordSecurityEvent } from '@/lib/security/security-events'

import { updateLastLoginAt } from '../services/auth-session.service'
import { isLegacySessionFallbackEnabled } from '../services/legacy-auth-fallback'
import {
  ensureSupabaseAuthUserForLegacyProfile,
  SupabaseAuthBridgeError,
} from '../services/supabase-auth-bridge.service'
import { createLoginSessions } from './login/create-login-sessions'
import {
  getUnknownErrorMessage,
  hasDigest,
} from './login/errors'
import { scheduleExpiredSessionCleanup } from './login/expired-session-cleanup'
import { readLoginFormInput } from './login/form-input'
import {
  buildLockoutErrorMessage,
  buildLoginAttemptContext,
  clearLoginLockout,
  getLoginLockoutStatus,
  recordFailedLoginAttempt,
} from './login/lockout'
import {
  createLoginMfaChallenge,
  createLoginMfaChallengeCookieOptions,
  LoginMfaChallengeError,
  LOGIN_MFA_CHALLENGE_COOKIE_NAME,
} from './login/mfa-login-challenge'
import { validateCustomOrganizationLogin } from './login/organization-context'
import { resolveLoginRedirect } from './login/redirect'
import { findLoginUser, validateLoginPassword } from './login/user-credentials'
import { notifyLoginSuccess } from './login/login-notifications'
import type { LoginUserRecord } from './login/types'

export async function loginAction(formData: FormData) {
  try {
    const humanVerification = await requireHumanVerification(formData)
    if (!humanVerification.ok) {
      recordSecurityEvent('login-failure', {
        metadata: { reason: 'human_verification_failed' },
      })
      return { error: humanVerification.error || 'Verificacion humana requerida' }
    }

    const parsed = readLoginFormInput(formData)
    const headersList = await headers()
    const loginAttemptContext = buildLoginAttemptContext(
      parsed.emailOrUsername,
      headersList,
    )
    const currentLockout = await getLoginLockoutStatus(loginAttemptContext)

    if (currentLockout.isLocked) {
      recordSecurityEvent('login-failure', {
        metadata: { reason: 'account_locked' },
      })
      return { error: buildLockoutErrorMessage(currentLockout) }
    }

    const supabase = createAdminClient()
    const user = await findLoginUser(supabase, parsed.emailOrUsername)

    if (!user) {
      const failedAttempt = await recordFailedLoginAttempt(loginAttemptContext)
      logger.warn('Login failed: user not found', {
        identifierLength: parsed.emailOrUsername.length,
      })
      recordSecurityEvent('login-failure', {
        metadata: { reason: 'user_not_found' },
      })
      return {
        error: failedAttempt.isLocked
          ? buildLockoutErrorMessage(failedAttempt)
          : 'Credenciales invalidas',
      }
    }

    if (user.is_banned) {
      recordSecurityEvent('login-failure', {
        actorId: user.id,
        actorRole: user.cargo_rol,
        metadata: { reason: 'USER_BANNED' },
      })
      return {
        error: `Tu cuenta ha sido suspendida por violaciones de las reglas de la comunidad. ${user.ban_reason || ''}`,
      }
    }

    try {
      const mfaStatus = await getMfaStatusForLogin(user.id)
      if (mfaStatus.enabled) {
        const passwordResult = await validatePasswordBeforeMfaChallenge({
          password: parsed.password,
          user,
        })
        if (!passwordResult.success) {
          const debugCode = passwordResult.debugCode
          logger.warn('Login failed: password validation failed', {
            nativeReason: passwordResult.nativeReason,
            userId: user.id,
            debugCode,
          })

          recordSecurityEvent('login-failure', {
            actorId: user.id,
            actorRole: user.cargo_rol,
            metadata: {
              nativeReason: passwordResult.nativeReason,
              reason: debugCode,
            },
          })

          const failedAttempt = await recordFailedLoginAttempt(loginAttemptContext)
          if (failedAttempt.isLocked) {
            return { error: buildLockoutErrorMessage(failedAttempt) }
          }

          return { error: passwordResult.error }
        }

        const challenge = createLoginMfaChallenge({
          emailOrUsername: parsed.emailOrUsername,
          formData,
          headers: headersList,
          rememberMe: parsed.rememberMe,
          userId: user.id,
        })
        const cookieStore = await cookies()
        cookieStore.set(
          LOGIN_MFA_CHALLENGE_COOKIE_NAME,
          challenge.nonce,
          createLoginMfaChallengeCookieOptions(),
        )

        recordSecurityEvent('mfa-challenge-issued', {
          actorId: user.id,
          actorRole: user.cargo_rol,
          metadata: { factorId: mfaStatus.factorId },
        })

        return {
          challengeToken: challenge.token,
          requiresMfa: true,
        }
      }
    } catch (mfaError) {
      const errorCode =
        mfaError instanceof LoginMfaChallengeError
          ? mfaError.code
          : mfaError instanceof MfaError
            ? mfaError.code
            : 'MFA_STATUS_UNAVAILABLE'

      logger.error('Login failed: MFA gate unavailable', {
        errorCode,
        userId: user.id,
      })
      recordSecurityEvent('login-failure', {
        actorId: user.id,
        actorRole: user.cargo_rol,
        result: 'error',
        metadata: { reason: errorCode },
      })

      return {
        error:
          'No se pudo validar la autenticacion multifactor. Por favor, intenta nuevamente.',
      }
    }

    const nativeLoginResult = await trySupabasePasswordLogin({
      password: parsed.password,
      user,
    })
    if (!nativeLoginResult.success) {
      const passwordResult = await validateLoginPassword(user, parsed.password)
      if (passwordResult) {
        const debugCode = !user.password_hash
          ? 'NO_PASSWORD_HASH'
          : 'PASSWORD_MISMATCH'
        logger.warn('Login failed: password validation failed', {
          nativeReason: nativeLoginResult.reason,
          userId: user.id,
          debugCode,
        })

        recordSecurityEvent('login-failure', {
          actorId: user.id,
          actorRole: user.cargo_rol,
          metadata: { reason: debugCode, nativeReason: nativeLoginResult.reason },
        })

        const failedAttempt = await recordFailedLoginAttempt(loginAttemptContext)
        if (failedAttempt.isLocked) {
          return { error: buildLockoutErrorMessage(failedAttempt) }
        }

        return passwordResult
      }

    }

    const organizationResult = await validateCustomOrganizationLogin({
      formData,
      supabase,
      user,
    })
    if (organizationResult) {
      logger.warn('Login failed: organization validation failed', {
        userId: user.id,
      })
      if (nativeLoginResult.success) {
        const authClient = await createAuthActionClient()
        await authClient.auth.signOut({ scope: 'local' })
      }
      recordSecurityEvent('login-failure', {
        actorId: user.id,
        actorRole: user.cargo_rol,
        metadata: { reason: 'organization_validation_failed' },
      })
      return organizationResult
    }

    if (nativeLoginResult.success) {
      await notifyLoginSuccess({
        ip: loginAttemptContext.ip,
        rememberMe: parsed.rememberMe,
        userAgent: headersList.get('user-agent') || 'unknown',
        userId: user.id,
      })
    } else {
      if (!isLegacySessionFallbackEnabled()) {
        logger.error('Supabase Auth login failed and legacy fallback is disabled', {
          reason: nativeLoginResult.reason,
          userId: user.id,
        })
        recordSecurityEvent('login-failure', {
          actorId: user.id,
          actorRole: user.cargo_rol,
          result: 'error',
          metadata: {
            nativeReason: nativeLoginResult.reason,
            reason: 'supabase_auth_unavailable_legacy_fallback_disabled',
          },
        })
        return {
          error:
            'No se pudo iniciar sesion con Supabase Auth. Por favor, intenta nuevamente.',
        }
      }

      logger.warn('Supabase Auth login unavailable; using legacy session fallback', {
        reason: nativeLoginResult.reason,
        userId: user.id,
      })
      const legacySessionResult = await createLoginSessions({
        rememberMe: parsed.rememberMe,
        userId: user.id,
      })
      if (legacySessionResult) {
        logger.error('Login failed: fallback session creation failed', {
          userId: user.id,
        })
        recordSecurityEvent('login-failure', {
          actorId: user.id,
          actorRole: user.cargo_rol,
          result: 'error',
          metadata: { reason: 'session_creation_failed' },
        })
        return legacySessionResult
      }
    }

    scheduleExpiredSessionCleanup()
    await clearLoginLockout(loginAttemptContext)
    await updateLastLoginAt(supabase, user.id)

    const redirectTo = await resolveLoginRedirect({ supabase, user })
    recordSecurityEvent('login-success', {
      actorId: user.id,
      actorRole: user.cargo_rol,
    })
    return { success: true, redirectTo }
  } catch (error) {
    if (hasDigest(error) && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error
    }

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return {
        error: firstError?.message || 'Error de validacion',
      }
    }

    if (error instanceof Error) {
      logger.error('Login unexpected error', {
        name: error.name,
        message: error.message,
      })

      if (error.message.includes('password_hash') || error.message.includes('password')) {
        return {
          error: 'Error al verificar las credenciales. Por favor, intenta nuevamente.',
        }
      }

      if (error.message.includes('session') || error.message.includes('cookie')) {
        return {
          error: 'Error al crear la sesion. Por favor, verifica las cookies de tu navegador.',
        }
      }
    }

    return {
      error: getUnknownErrorMessage(error, 'Error inesperado al iniciar sesion'),
    }
  }
}

async function trySupabasePasswordLogin(input: {
  password: string
  user: LoginUserRecord
}): Promise<{ success: true } | { reason: string; success: false }> {
  if (!input.user.email) {
    return { reason: 'MISSING_EMAIL', success: false }
  }

  try {
    await ensureSupabaseAuthUserForLegacyProfile(input.user)
    const authClient = await createAuthActionClient()
    const { data, error } = await authClient.auth.signInWithPassword({
      email: input.user.email,
      password: input.password,
    })

    if (error || !data.user) {
      return {
        reason: error?.message || 'AUTH_SIGNIN_FAILED',
        success: false,
      }
    }

    if (data.user.id !== input.user.id) {
      await authClient.auth.signOut({ scope: 'local' })
      return { reason: 'AUTH_USER_ID_MISMATCH', success: false }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof SupabaseAuthBridgeError) {
      return { reason: error.code, success: false }
    }

    return {
      reason: error instanceof Error ? error.message : 'AUTH_LOGIN_ERROR',
      success: false,
    }
  }
}

async function validatePasswordBeforeMfaChallenge(input: {
  password: string
  user: LoginUserRecord
}): Promise<
  | { success: true }
  | {
      debugCode: string
      error: string
      nativeReason?: string
      success: false
    }
> {
  const nativePasswordResult = await trySupabasePasswordVerification(input)
  if (nativePasswordResult.success) {
    return { success: true }
  }

  if (nativePasswordResult.reason === 'AUTH_PRE_MFA_SIGNOUT_FAILED') {
    return {
      debugCode: 'AUTH_PRE_MFA_SIGNOUT_FAILED',
      error:
        'No se pudo preparar la autenticacion multifactor. Por favor, intenta nuevamente.',
      nativeReason: nativePasswordResult.reason,
      success: false,
    }
  }

  if (!input.user.password_hash) {
    return {
      debugCode: 'SUPABASE_AUTH_PASSWORD_MISMATCH',
      error: 'Credenciales invalidas',
      nativeReason: nativePasswordResult.reason,
      success: false,
    }
  }

  const legacyPasswordResult = await validateLoginPassword(input.user, input.password)
  if (!legacyPasswordResult) {
    return { success: true }
  }

  return {
    debugCode: 'PASSWORD_MISMATCH',
    error: legacyPasswordResult.error,
    nativeReason: nativePasswordResult.reason,
    success: false,
  }
}

async function trySupabasePasswordVerification(input: {
  password: string
  user: LoginUserRecord
}): Promise<{ success: true } | { reason: string; success: false }> {
  if (!input.user.email) {
    return { reason: 'MISSING_EMAIL', success: false }
  }

  try {
    await ensureSupabaseAuthUserForLegacyProfile(input.user)
    const authClient = await createAuthActionClient()
    const { data, error } = await authClient.auth.signInWithPassword({
      email: input.user.email,
      password: input.password,
    })

    if (error || !data.user) {
      return {
        reason: error?.message || 'AUTH_SIGNIN_FAILED',
        success: false,
      }
    }

    if (data.user.id !== input.user.id) {
      const { error: signOutError } = await authClient.auth.signOut({ scope: 'local' })
      if (signOutError) {
        return { reason: 'AUTH_PRE_MFA_SIGNOUT_FAILED', success: false }
      }
      return { reason: 'AUTH_USER_ID_MISMATCH', success: false }
    }

    const { error: signOutError } = await authClient.auth.signOut({ scope: 'local' })
    if (signOutError) {
      return { reason: 'AUTH_PRE_MFA_SIGNOUT_FAILED', success: false }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof SupabaseAuthBridgeError) {
      return { reason: error.code, success: false }
    }

    return {
      reason: error instanceof Error ? error.message : 'AUTH_PASSWORD_VERIFY_ERROR',
      success: false,
    }
  }
}
