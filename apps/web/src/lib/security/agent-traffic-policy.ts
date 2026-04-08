import type { NextRequest } from 'next/server'
import type { SecurityStateCookie } from './security-state'
import type { TrustedAgentValidation } from './trusted-agent-auth'

const AUTOMATED_UA_PATTERNS = [
  /headless/i,
  /playwright/i,
  /puppeteer/i,
  /selenium/i,
  /phantomjs/i,
  /scrapy/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /go-http-client/i,
  /httpclient/i,
  /gptbot/i,
  /chatgpt-user/i,
  /claude/i,
  /anthropic/i,
  /perplexity/i,
  /bytespider/i,
  /cohere-ai/i,
  /facebookexternalhit/i,
  /crawler/i,
  /spider/i,
  /bot/i,
  /browserless/i,
  /automation/i,
  /openai/i,
  /codex/i,
  /browser-use/i,
]

const SENSITIVE_PATH_PATTERNS = [
  /^\/api\//,
  /^\/admin(?:\/|$)/,
  /^\/auth(?:\/|$)/,
  /^\/dashboard(?:\/|$)/,
  /^\/profile(?:\/|$)/,
  /^\/account-settings(?:\/|$)/,
  /^\/study-planner(?:\/|$)/,
  /^\/certificates(?:\/|$)/,
  /^\/business-panel(?:\/|$)/,
  /^\/business-user(?:\/|$)/,
  /^\/[^/]+\/business-panel(?:\/|$)/,
  /^\/[^/]+\/business-user(?:\/|$)/,
]

const PUBLIC_PROTECTION_BYPASS_PATTERNS = [
  /^\/_next\//,
  /^\/verification(?:\/|$)/,
  /^\/api\/security\//,
  /^\/api\/_agent-trap(?:\/|$)/,
  /^\/favicon\.ico$/,
  /^\/icono\.(?:ico|png)$/,
  /^\/manifest\.json$/,
  /^\/robots\.txt$/,
  /^\/llms\.txt$/,
  /^\/sitemap\.xml$/,
]

const STATIC_ASSET_PATTERN =
  /\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|mjs|map|txt|woff2?|ttf|eot|json|xml|mp4|webm|mp3|wav)$/i

export interface AgentTrafficAssessment {
  automated: boolean
  reasons: string[]
  userAgent: string
  ip?: string
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    undefined
  )
}

function isDocumentNavigationRequest(request: NextRequest) {
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

function isPublicProtectionBypassPath(pathname: string) {
  return (
    PUBLIC_PROTECTION_BYPASS_PATTERNS.some((pattern) => pattern.test(pathname)) ||
    STATIC_ASSET_PATTERN.test(pathname)
  )
}

function getSecuritySignalScore(securityState: SecurityStateCookie | null) {
  return securityState?.automationSignalScore || 0
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
