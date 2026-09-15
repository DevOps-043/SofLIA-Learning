import { getLegacyRegisterInvitePath } from '@/features/auth/services/legacy-register-route.service'
import { NextRequest, NextResponse } from 'next/server'

export function GET(request: NextRequest) {
  const destination = getLegacyRegisterInvitePath(
    request.nextUrl.searchParams.get('invite') ?? undefined,
  )

  if (!destination) {
    return NextResponse.json(
      { success: false, error: 'Enlace de invitación no válido' },
      { status: 404 },
    )
  }

  return NextResponse.redirect(new URL(destination, request.url), 307)
}
