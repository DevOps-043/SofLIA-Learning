import { NextRequest, NextResponse } from 'next/server'
import {
  getSecurityStateCookieOptions,
  mergeSecurityState,
  readSecurityStateFromRequest,
  SECURITY_STATE_COOKIE_NAME,
  serializeSecurityState,
} from '@/lib/security/security-state'
import { recordSecurityEvent } from '@/lib/security/security-events'

export const dynamic = 'force-dynamic'

interface AutomationSignalPayload {
  webdriver?: boolean
  headlessUa?: boolean
  headlessBrand?: boolean
  playwright?: boolean
  selenium?: boolean
  cdcArtifacts?: number
  emptyPlugins?: boolean
  emptyLanguages?: boolean
  path?: string
}

function toBoolean(value: unknown) {
  return value === true
}

function toNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function scoreAutomationSignals(payload: AutomationSignalPayload) {
  let score = 0
  const reasons: string[] = []

  if (toBoolean(payload.webdriver)) {
    score += 60
    reasons.push('navigator.webdriver')
  }

  if (toBoolean(payload.headlessUa)) {
    score += 35
    reasons.push('headless user-agent')
  }

  if (toBoolean(payload.headlessBrand)) {
    score += 35
    reasons.push('headless browser brand')
  }

  if (toBoolean(payload.playwright)) {
    score += 60
    reasons.push('playwright globals detected')
  }

  if (toBoolean(payload.selenium)) {
    score += 60
    reasons.push('selenium globals detected')
  }

  if (toNumber(payload.cdcArtifacts) > 0) {
    score += 40
    reasons.push('cdc artifacts detected')
  }

  if (toBoolean(payload.emptyPlugins)) {
    score += 10
    reasons.push('navigator.plugins empty')
  }

  if (toBoolean(payload.emptyLanguages)) {
    score += 10
    reasons.push('navigator.languages empty')
  }

  return {
    score: Math.min(score, 100),
    reasons,
  }
}

async function readPayload(request: NextRequest) {
  try {
    return (await request.json()) as AutomationSignalPayload
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const payload = await readPayload(request)
  const responseHeaders = {
    'Cache-Control': 'private, no-store, max-age=0',
    'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
  }

  if (!payload) {
    return new NextResponse(null, { status: 204, headers: responseHeaders })
  }

  const { score, reasons } = scoreAutomationSignals(payload)

  if (score < 25) {
    return new NextResponse(null, { status: 204, headers: responseHeaders })
  }

  const currentState = readSecurityStateFromRequest(request)
  const nextState = mergeSecurityState(currentState, {
    automationSignalScore: Math.max(
      currentState?.automationSignalScore || 0,
      score,
    ),
    automationDetectedAt: Date.now(),
  })

  const response = new NextResponse(null, {
    status: 204,
    headers: responseHeaders,
  })
  response.cookies.set(
    SECURITY_STATE_COOKIE_NAME,
    serializeSecurityState(nextState),
    getSecurityStateCookieOptions(),
  )

  recordSecurityEvent('automation-signal-received', {
    pathname: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ip:
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for') ||
      undefined,
    reasons,
    metadata: {
      score,
      path: payload.path,
    },
  })

  return response
}
