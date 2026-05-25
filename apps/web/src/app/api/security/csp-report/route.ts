import { NextRequest, NextResponse } from 'next/server';

import { withZodBody } from '@/lib/api/with-validation';
import { recordSecurityEvent } from '@/lib/security/security-events';

import { cspReportSchema, type CspReportBody } from '../_schemas';

export const runtime = 'nodejs';

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function getStringField(record: Record<string, unknown> | undefined, field: string) {
  const value = record?.[field];
  return typeof value === 'string' ? value : undefined;
}

async function handlePost(request: NextRequest, payload: CspReportBody) {
  const report = asRecord(payload['csp-report']);

  recordSecurityEvent('csp-violation', {
    pathname: request.nextUrl.pathname,
    method: request.method,
    ip: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
    result: 'denied',
    metadata: {
      blockedUri: getStringField(report, 'blocked-uri'),
      documentUri: getStringField(report, 'document-uri'),
      effectiveDirective: getStringField(report, 'effective-directive'),
      violatedDirective: getStringField(report, 'violated-directive'),
    },
  });

  return new NextResponse(null, { status: 204 });
}

export const POST = withZodBody(cspReportSchema, handlePost, {
  emptyBodyFallback: {},
});
