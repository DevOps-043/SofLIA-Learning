'use server'

import { createClient } from '@/lib/supabase/server'
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
      return { error: 'Credenciales invalidas' }
    }

    const passwordResult = await validateLoginPassword(user, parsed.password)
    if (passwordResult) {
      return passwordResult
    }

    const organizationResult = await validateCustomOrganizationLogin({
      formData,
      supabase,
      user,
    })
    if (organizationResult) {
      return organizationResult
    }

    const sessionResult = await createLoginSessions({
      rememberMe: parsed.rememberMe,
      userId: user.id,
    })
    if (sessionResult) {
      return sessionResult
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
      return { error: firstError?.message || 'Error de validacion' }
    }

    if (error instanceof Error) {
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
