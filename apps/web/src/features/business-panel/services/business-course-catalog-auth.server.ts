import 'server-only'

import { NextResponse } from 'next/server'
import { requireBusiness, type RequireBusinessOptions } from '@/lib/auth/requireBusiness'
import { isPlatformAdminRole } from '@/lib/auth/platform-role'

/** The privileged catalog supports managers only, scoped to their selected org. */
export async function requireBusinessCourseCatalog(options?: RequireBusinessOptions) {
  const auth = await requireBusiness(options)
  if (auth instanceof NextResponse) return auth

  if (!isPlatformAdminRole(auth.userRole) && (!auth.organizationId || !auth.isOrgAdmin)) {
    return NextResponse.json(
      { success: false, error: 'Se requiere acceso de administrador a esta organización.' },
      { status: 403 },
    )
  }

  return auth
}
