import type { NextRequest } from 'next/server'
import type { SecurityStateCookie } from './security-state'
import type { TrustedAgentValidation } from './trusted-agent-auth'
import {
  AUTOMATED_UA_PATTERNS,
  SENSITIVE_PATH_PATTERNS,
} from './agent-traffic-policy.constants'
import {
  getClientIp,
  getSecuritySignalScore,
  isDocumentNavigationRequest,
  isPublicProtectionBypassPath,
} from './agent-traffic-policy.helpers'

export interface AgentTrafficAssessment {
  automated: boolean
  reasons: string[]
  userAgent: string
  ip?: string
}

export function assessAgentTraffic(request: NextRequest): AgentTrafficAssessment {
  const userAgent = request.headers.get('user-agent') || ''
  const reasons = AUTOMATED_UA_PATTERNS
    .filter((pattern) => pattern.test(userAgent))
    .map((pattern) => pattern.source)

  return {
    automated: reasons.length > 0,
    reasons,
    userAgent,
    ip: getClientIp(request),
  }
}

export function isSensitivePath(pathname: string) {
  return SENSITIVE_PATH_PATTERNS.some((pattern) => pattern.test(pathname))
}

export function shouldRequireAutomationChallenge(params: {
  request: NextRequest
  pathname: string
  assessment: AgentTrafficAssessment
  securityState: SecurityStateCookie | null
  trustedAgent: TrustedAgentValidation
  hasVerifiedHumanCookie: boolean
}) {
  const {
    request,
    pathname,
    assessment,
    securityState,
    trustedAgent,
    hasVerifiedHumanCookie,
  } = params

  if (trustedAgent.trusted) {
    return false
  }

  if (!isDocumentNavigationRequest(request)) {
    return false
  }

  if (isSensitivePath(pathname) || isPublicProtectionBypassPath(pathname)) {
    return false
  }

  if (securityState?.honeypotHitAt) {
    return true
  }

  if (hasVerifiedHumanCookie) {
    return false
  }

  if (getSecuritySignalScore(securityState) >= 40) {
    return true
  }

  return assessment.automated
}

export function shouldBlockAutomatedSensitiveAccess(params: {
  pathname: string
  assessment: AgentTrafficAssessment
  securityState: SecurityStateCookie | null
  trustedAgent: TrustedAgentValidation
}) {
  const { pathname, assessment, securityState, trustedAgent } = params

  if (trustedAgent.trusted) {
    return false
  }

  if (isPublicProtectionBypassPath(pathname)) {
    return false
  }

  if (!isSensitivePath(pathname)) {
    return false
  }

  if (securityState?.honeypotHitAt) {
    return true
  }

  if (getSecuritySignalScore(securityState) >= 40) {
    return true
  }

  return assessment.automated
}
