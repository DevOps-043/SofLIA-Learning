import { NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { HierarchyChatsError } from './errors'
import type { BusinessAuthContext } from './types'

export async function requireBusinessOrganization() {
  const auth = await requireBusiness()
  if (auth instanceof NextResponse) return auth

  if (!auth.organizationId) {
    throw new HierarchyChatsError(403, {
      success: false,
      error: 'No tienes una organización asignada',
    })
  }

  return {
    userId: auth.userId,
    organizationId: auth.organizationId,
  } satisfies BusinessAuthContext
}
