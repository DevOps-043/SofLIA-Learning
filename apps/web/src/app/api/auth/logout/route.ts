import { NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { SessionService } from '@/features/auth/services/session.service'

const AUTH_COOKIE_NAMES = [
  'access_token',
  'refresh_token',
  'aprende-y-aplica-session',
] as const

function clearAuthCookies(response: NextResponse): void {
  for (const cookieName of AUTH_COOKIE_NAMES) {
    response.cookies.set(cookieName, '', {
      expires: new Date(0),
      httpOnly: true,
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }
}

function buildLogoutResponse(
  body: { success: true; message: string },
  status: number = 200
): NextResponse {
  const response = NextResponse.json(body, { status })
  response.headers.set('Cache-Control', 'no-store')
  clearAuthCookies(response)
  return response
}

export async function POST(_request?: Request) {
  try {
    logger.auth('Logout request received')
    await SessionService.destroySession()

    return buildLogoutResponse({
      success: true,
      message: 'Sesion cerrada exitosamente',
    })
  } catch (error) {
    logger.error('Logout session destruction failed', error)

    return buildLogoutResponse({
      success: true,
      message: 'Sesion local cerrada',
    })
  }
}
