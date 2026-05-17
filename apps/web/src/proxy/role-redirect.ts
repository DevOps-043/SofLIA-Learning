import { NextResponse, type NextRequest } from 'next/server'

export function redirectByNormalizedRole(request: NextRequest, normalizedRole: string | null | undefined) {
  if (normalizedRole === 'administrador') return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  if (normalizedRole === 'instructor') return NextResponse.redirect(new URL('/instructor/dashboard', request.url))
  if (normalizedRole === 'business') return NextResponse.redirect(new URL('/business-panel/dashboard', request.url))
  if (normalizedRole === 'business user') return NextResponse.redirect(new URL('/business-user/dashboard', request.url))
  return NextResponse.redirect(new URL('/dashboard', request.url))
}

export function normalizeRole(role: string | null | undefined) {
  return role?.toLowerCase().trim()
}
