'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { headers } from 'next/headers'
import { requireHumanVerification } from '@/lib/security/bot-protection'
import { recordSecurityEvent } from '@/lib/security/security-events'

import { updateLastLoginAt } from '../services/auth-session.service'
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
import { validateCustomOrganizationLogin } from './login/organization-context'
import { resolveLoginRedirect } from './login/redirect'
import { findLoginUser, validateLoginPassword } from './login/user-credentials'

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
    const loginAttemptContext = buildLoginAttemptContext(
      parsed.emailOrUsername,
      await headers(),
    )
    const currentLockout = await getLoginLockoutStatus(loginAttemptContext)

    if (currentLockout.isLocked) {
      recordSecurityEvent('login-failure', {
        metadata: { reason: 'account_locked' },
      })
      return { error: buildLockoutErrorMessage(currentLockout) }
    }

    const supabase = await createClient()
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

    const passwordResult = await validateLoginPassword(user, parsed.password)
    if (passwordResult) {
      const isBanned = 'banned' in passwordResult && passwordResult.banned === true
      const debugCode = isBanned
        ? 'USER_BANNED'
        : !user.password_hash
          ? 'NO_PASSWORD_HASH'
          : 'PASSWORD_MISMATCH'
      logger.warn('Login failed: password validation failed', {
        userId: user.id,
        debugCode,
      })

      recordSecurityEvent('login-failure', {
        actorId: user.id,
        actorRole: user.cargo_rol,
        metadata: { reason: debugCode },
      })

      if (!isBanned) {
        const failedAttempt = await recordFailedLoginAttempt(loginAttemptContext)
        if (failedAttempt.isLocked) {
          return { error: buildLockoutErrorMessage(failedAttempt) }
        }
      }

      return passwordResult
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
      recordSecurityEvent('login-failure', {
        actorId: user.id,
        actorRole: user.cargo_rol,
        metadata: { reason: 'organization_validation_failed' },
      })
      return organizationResult
    }

    const sessionResult = await createLoginSessions({
      rememberMe: parsed.rememberMe,
      userId: user.id,
    })
    if (sessionResult) {
      logger.error('Login failed: session creation failed', {
        userId: user.id,
      })
      recordSecurityEvent('login-failure', {
        actorId: user.id,
        actorRole: user.cargo_rol,
        result: 'error',
        metadata: { reason: 'session_creation_failed' },
      })
      return sessionResult
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
