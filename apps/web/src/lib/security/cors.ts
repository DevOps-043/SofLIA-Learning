import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
const ALLOWED_HEADERS =
  'Authorization, Content-Type, X-Requested-With, X-Correlation-Id, X-CSRF-Token, X-Soflia-Agent-Id, X-Soflia-Agent-Signature';
const EXPOSED_HEADERS =
  'X-Correlation-Id, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After';
const PREFLIGHT_MAX_AGE = '600';
const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SESSION_COOKIE_NAMES = [
  'aprende-y-aplica-session=',
  'access_token=',
  'refresh_token=',
  'sb-',
];

function parseAllowedOrigins(): string[] {
  const raw = process.env.WEB_ALLOWED_ORIGINS ?? process.env.ALLOWED_ORIGINS ?? '';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isProductionLike(): boolean {
  return process.env.NODE_ENV === 'production';
}

function getDefaultDevOrigins(): string[] {
  return ['http://localhost:3000', 'http://127.0.0.1:3000'];
}

export function getEffectiveAllowedOrigins(): string[] {
  const configured = parseAllowedOrigins();
  if (configured.length > 0) return configured;
  if (!isProductionLike()) return getDefaultDevOrigins();
  return [];
}

function originMatches(origin: string, allowed: string): boolean {
  if (!allowed.includes('*')) return origin === allowed;
  const pattern = new RegExp(
    `^${allowed.split('*').map(escapeRegex).join('[^.]+')}$`,
  );
  return pattern.test(origin);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const allowed = getEffectiveAllowedOrigins();
  return allowed.some((entry) => originMatches(origin, entry));
}

function buildCorsHeaders(origin: string): Headers {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Vary', 'Origin');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS);
  headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  headers.set('Access-Control-Expose-Headers', EXPOSED_HEADERS);
  headers.set('Access-Control-Max-Age', PREFLIGHT_MAX_AGE);
  return headers;
}

function isApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

function isSameOriginRequest(origin: string | null, host: string | null): boolean {
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function applyCorsHeaders(
  response: NextResponse,
  request: NextRequest,
): NextResponse {
  const origin = request.headers.get('origin');
  if (!origin) return response;
  if (!isApiPath(request.nextUrl.pathname)) return response;
  if (isSameOriginRequest(origin, request.headers.get('host'))) return response;
  if (!isOriginAllowed(origin)) return response;

  const corsHeaders = buildCorsHeaders(origin);
  corsHeaders.forEach((value, key) => response.headers.set(key, value));
  return response;
}

export function enforceCors(request: NextRequest): NextResponse | null {
  if (!isApiPath(request.nextUrl.pathname)) return null;

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const isPreflight = request.method === 'OPTIONS';

  if (isSameOriginRequest(origin, host)) {
    return isPreflight
      ? new NextResponse(null, {
          status: 204,
          headers: { 'Access-Control-Max-Age': PREFLIGHT_MAX_AGE },
        })
      : null;
  }

  if (!origin) {
    return isPreflight ? new NextResponse(null, { status: 204 }) : null;
  }

  if (!isOriginAllowed(origin)) {
    return new NextResponse(
      JSON.stringify({
        error: 'CORS_ORIGIN_NOT_ALLOWED',
        message: 'Origin is not in the allowed list',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  if (isPreflight) {
    return new NextResponse(null, {
      status: 204,
      headers: buildCorsHeaders(origin),
    });
  }

  return null;
}

export function enforceCsrfOrigin(request: NextRequest): NextResponse | null {
  if (!isApiPath(request.nextUrl.pathname)) return null;
  if (!STATE_CHANGING_METHODS.has(request.method.toUpperCase())) return null;

  const cookieHeader = request.headers.get('cookie') ?? '';
  const hasSessionCookie = SESSION_COOKIE_NAMES.some((name) => cookieHeader.includes(name));
  if (!hasSessionCookie) return null;

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const fetchSite = request.headers.get('sec-fetch-site');
  const trustedOrigin = Boolean(origin) && (
    isSameOriginRequest(origin, host) || isOriginAllowed(origin)
  );

  if (trustedOrigin && fetchSite !== 'cross-site') return null;

  return NextResponse.json(
    { error: 'CSRF_ORIGIN_VALIDATION_FAILED' },
    {
      status: 403,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
