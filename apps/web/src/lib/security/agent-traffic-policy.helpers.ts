import type { NextRequest } from 'next/server'
import type { SecurityStateCookie } from './security-state'
import {
  PUBLIC_PROTECTION_BYPASS_PATTERNS,
  STATIC_ASSET_PATTERN,
} from './agent-traffic-policy.constants'

export function getClientIp(request: NextRequest) {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    undefined
  )
}

export function isDocumentNavigationRequest(request: NextRequest) {
  if (request.method !== 'GET') {
    return false
  }

  const fetchDestination = request.headers.get('sec-fetch-dest')
  const accept = request.headers.get('accept') || ''

  return (
    fetchDestination === 'document' ||
    fetchDestination === 'empty' ||
    accept.includes('text/html')
  )
}

export function isPublicProtectionBypassPath(pathname: string) {
  return (
    PUBLIC_PROTECTION_BYPASS_PATTERNS.some((pattern) => pattern.test(pathname)) ||
    STATIC_ASSET_PATTERN.test(pathname)
  )
}

export function getSecuritySignalScore(securityState: SecurityStateCookie | null) {
  return securityState?.automationSignalScore || 0
}
