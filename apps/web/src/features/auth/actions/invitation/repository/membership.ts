import type {
  CreateOrganizationMembershipInput,
  InvitationRepository,
  OrganizationMembershipRecord,
} from '../types'
import { organizationUsersTable, usersTable } from './tables'

type MembershipMethods = Pick<
  InvitationRepository,
  'addOrganizationMembership' | 'findOrganizationMembership' | 'setUserBusinessRole'
>

export function createMembershipMethods(supabase: unknown): MembershipMethods {
  return {
    async addOrganizationMembership(input: CreateOrganizationMembershipInput) {
      const { error } = await organizationUsersTable(supabase).insert({
        joined_at: input.joinedAt,
        organization_id: input.organizationId,
        role: input.role,
        status: input.status,
        user_id: input.userId,
      })

      if (error) {
        throw error
      }
    },

    async findOrganizationMembership(
      userId: string,
      organizationId: string
    ): Promise<OrganizationMembershipRecord | null> {
      const { data } = await organizationUsersTable(supabase)
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single()

      return data ?? null
    },

    async setUserBusinessRole(userId: string) {
      const { error } = await usersTable(supabase)
        .update({ cargo_rol: 'Business' })
        .eq('id', userId)
        .neq('cargo_rol', 'Administrador')

      if (error) {
        throw error
      }
    },
  }
}
