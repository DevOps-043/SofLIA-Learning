import { NextRequest, NextResponse } from 'next/server';
import { recordSecurityEvent } from '@/lib/security/security-events';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null) as {
    'csp-report'?: {
      'blocked-uri'?: string;
      'document-uri'?: string;
      'effective-directive'?: string;
      'violated-directive'?: string;
    };
  } | null;
  const report = payload?.['csp-report'];

  recordSecurityEvent('csp-violation', {
    pathname: request.nextUrl.pathname,
    method: request.method,
    ip: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
    result: 'denied',
    metadata: {
      blockedUri: report?.['blocked-uri'],
      documentUri: report?.['document-uri'],
      effectiveDirective: report?.['effective-directive'],
      violatedDirective: report?.['violated-directive'],
    },
  });

  return new NextResponse(null, { status: 204 });
}
