import type { NextRequest } from 'next/server'

export interface WorkshopRouteContext {
  params: Promise<{ id: string }>
}

export interface WorkshopAuditContext {
  ip: string
  userAgent: string
}

export function buildWorkshopAuditContext(request: NextRequest): WorkshopAuditContext {
  return {
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  }
}
