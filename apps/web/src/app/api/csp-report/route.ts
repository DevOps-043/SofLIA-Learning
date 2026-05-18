import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { recordSecurityEvent } from '@/lib/security/security-events'

export const runtime = 'nodejs'

const MAX_REPORT_BYTES = 64 * 1024
const MAX_FIELD_LENGTH = 512

type CspReportPayload = {
  'csp-report'?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10)

  if (Number.isFinite(contentLength) && contentLength > MAX_REPORT_BYTES) {
    logger.warn('security.csp_report_too_large', { contentLength })
    return new NextResponse(null, { status: 204 })
  }

  try {
    const rawBody = await request.text()
    if (rawBody.length > MAX_REPORT_BYTES) {
      logger.warn('security.csp_report_body_too_large', { bodyLength: rawBody.length })
      return new NextResponse(null, { status: 204 })
    }

    const parsed = parseCspReport(rawBody)
    if (parsed) {
      logger.warn('security.csp_violation_reported', parsed)
      recordSecurityEvent('csp-violation', {
        ip: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || undefined,
        method: request.method,
        pathname: request.nextUrl.pathname,
        result: 'denied',
        userAgent: request.headers.get('user-agent') || undefined,
        metadata: parsed,
      })
    }
  } catch (error) {
    logger.warn('security.csp_report_parse_failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
  }

  return new NextResponse(null, { status: 204 })
}

function parseCspReport(rawBody: string): Record<string, unknown> | null {
  const payload = JSON.parse(rawBody) as CspReportPayload
  const report = payload['csp-report']

  if (!report || typeof report !== 'object') {
    return null
  }

  return {
    blockedUri: sanitizeReportUrl(report['blocked-uri']),
    columnNumber: sanitizeNumber(report['column-number']),
    disposition: sanitizeText(report.disposition),
    documentUri: sanitizeReportUrl(report['document-uri']),
    effectiveDirective: sanitizeText(report['effective-directive']),
    lineNumber: sanitizeNumber(report['line-number']),
    sourceFile: sanitizeReportUrl(report['source-file']),
    statusCode: sanitizeNumber(report['status-code']),
    violatedDirective: sanitizeText(report['violated-directive']),
  }
}

function sanitizeText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  return value.slice(0, MAX_FIELD_LENGTH)
}

function sanitizeNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function sanitizeReportUrl(value: unknown): string | undefined {
  const text = sanitizeText(value)
  if (!text) {
    return undefined
  }

  if (text === 'self' || text === 'inline' || text === 'eval' || text === 'data') {
    return text
  }

  try {
    const url = new URL(text)
    return `${url.origin}${url.pathname}`.slice(0, MAX_FIELD_LENGTH)
  } catch {
    return text.split('?')[0]?.slice(0, MAX_FIELD_LENGTH)
  }
}
