import type { InvitationRepository, UserRecord } from '../types'
import { usersTable } from './tables'

type UserMethods = Pick<InvitationRepository, 'findUserByEmail' | 'findUserById'>

export function createUserMethods(supabase: unknown): UserMethods {
  return {
    async findUserByEmail(email: string): Promise<UserRecord | null> {
      const { data } = await usersTable(supabase)
        .select('id, cargo_rol')
        .ilike('email', email)
        .single()

      return data
        ? {
            cargoRol: data.cargo_rol ?? null,
            id: data.id,
          }
        : null
    },

    async findUserById(userId: string): Promise<UserRecord | null> {
      const { data } = await usersTable(supabase)
        .select('id, cargo_rol')
        .eq('id', userId)
        .single()

      return data
        ? {
            cargoRol: data.cargo_rol ?? null,
            id: data.id,
          }
        : null
    },
  }
}
