import { NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import type { BusinessAuthContext } from './types'

export async function requireBusinessProgressAccess() {
  const auth = await requireBusiness()
  if (auth instanceof NextResponse) return auth

  if (!auth.organizationId) {
    return NextResponse.json(
      { success: false, error: 'No tienes una organización asignada' },
      { status: 403 },
    )
  }

  return {
    userId: auth.userId,
    organizationId: auth.organizationId,
  } satisfies BusinessAuthContext
}
