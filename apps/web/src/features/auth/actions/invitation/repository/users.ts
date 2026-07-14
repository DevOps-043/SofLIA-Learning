import { escapeIlikePattern } from '@/lib/supabase/ilike-escape'

import type { InvitationRepository, UserRecord } from '../types'
import { usersTable } from './tables'

type UserMethods = Pick<InvitationRepository, 'findUserByEmail' | 'findUserById'>

export function createUserMethods(supabase: unknown): UserMethods {
  return {
    async findUserByEmail(email: string): Promise<UserRecord | null> {
      const normalized = email.trim()
      if (!normalized) {
        return null
      }

      const { data } = await usersTable(supabase)
        .select('id, platform_role')
        .ilike('email', escapeIlikePattern(normalized))
        .maybeSingle()

      return data
        ? {
            cargoRol: data.platform_role ?? null,
            id: data.id,
          }
        : null
    },

    async findUserById(userId: string): Promise<UserRecord | null> {
      const { data } = await usersTable(supabase)
        .select('id, platform_role')
        .eq('id', userId)
        .single()

      return data
        ? {
            cargoRol: data.platform_role ?? null,
            id: data.id,
          }
        : null
    },
  }
}
