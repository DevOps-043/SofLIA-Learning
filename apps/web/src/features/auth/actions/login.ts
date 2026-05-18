'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

import { updateLastLoginAt } from '../services/auth-session.service'
import { createLoginSessions } from './login/create-login-sessions'
import {
  getUnknownErrorMessage,
  hasDigest,
} from './login/errors'
import { scheduleExpiredSessionCleanup } from './login/expired-session-cleanup'
import { readLoginFormInput } from './login/form-input'
import { validateCustomOrganizationLogin } from './login/organization-context'
import { resolveLoginRedirect } from './login/redirect'
import { findLoginUser, validateLoginPassword } from './login/user-credentials'

export async function loginAction(formData: FormData) {
  try {
    const parsed = readLoginFormInput(formData)
    const supabase = await createClient()
    const user = await findLoginUser(supabase, parsed.emailOrUsername)

    if (!user) {
      logger.warn('Login failed: user not found', {
        input: parsed.emailOrUsername.slice(0, 32),
      })
      return { error: 'Credenciales invalidas', debugCode: 'USER_NOT_FOUND' }
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
      return { ...passwordResult, debugCode }
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
      return { ...organizationResult, debugCode: 'ORG_VALIDATION_FAILED' }
    }

    const sessionResult = await createLoginSessions({
      rememberMe: parsed.rememberMe,
      userId: user.id,
    })
    if (sessionResult) {
      logger.error('Login failed: session creation failed', {
        userId: user.id,
      })
      return { ...sessionResult, debugCode: 'SESSION_CREATION_FAILED' }
    }

    scheduleExpiredSessionCleanup()
    await updateLastLoginAt(supabase, user.id)

    const redirectTo = await resolveLoginRedirect({ supabase, user })
    return { success: true, redirectTo }
  } catch (error) {
    if (hasDigest(error) && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error
    }

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return {
        error: firstError?.message || 'Error de validacion',
        debugCode: 'VALIDATION_ERROR',
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
          debugCode: 'BCRYPT_ERROR',
        }
      }

      if (error.message.includes('session') || error.message.includes('cookie')) {
        return {
          error: 'Error al crear la sesion. Por favor, verifica las cookies de tu navegador.',
          debugCode: 'SESSION_ERROR',
        }
      }
    }

    return {
      error: getUnknownErrorMessage(error, 'Error inesperado al iniciar sesion'),
      debugCode: 'UNEXPECTED_ERROR',
    }
  }
}
