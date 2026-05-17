import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { resolveAuthenticatedUserId } from './require-user.sessions'
import {
  bannedUserResponse,
  internalServerErrorResponse,
  unauthenticatedResponse,
  userNotFoundResponse,
} from './require-user.responses'
import type { RequireUserOptions, UserAuth } from './require-user.types'

export type { RequireUserOptions, UserAuth } from './require-user.types'

export async function requireUser(
  options: RequireUserOptions = {},
): Promise<UserAuth | NextResponse> {
  const { allowBanned = false } = options

  try {
    const cookieStore = await cookies()
    const supabase = await createClient()
    const userId = await resolveAuthenticatedUserId(cookieStore, supabase)

    if (!userId) {
      return unauthenticatedResponse()
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, cargo_rol, is_banned')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return userNotFoundResponse()
    }

    if (user.is_banned && !allowBanned) {
      return bannedUserResponse()
    }

    logger.debug('User authenticated', { userId: user.id, role: user.cargo_rol })

    return {
      userId: user.id,
      userEmail: user.email ?? '',
      userRole: user.cargo_rol ?? '',
    }
  } catch (error) {
    logger.error('Error in requireUser middleware', error instanceof Error ? error : undefined)
    return internalServerErrorResponse()
  }
}
