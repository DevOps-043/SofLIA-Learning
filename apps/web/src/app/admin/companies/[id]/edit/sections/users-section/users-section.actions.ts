'use client'

import { resendInvitationAction, revokeInvitationAction } from '@/features/auth/actions/invitation'

export async function resendCompanyInvitation(invitationId: string) {
  return resendInvitationAction(invitationId)
}

export async function revokeCompanyInvitation(invitationId: string) {
  return revokeInvitationAction(invitationId)
}
