import { NextRequest, NextResponse } from 'next/server';
import type { ValidationResult } from './auth.types';

export function createUnauthorizedResponse(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(
    new URL('/auth?error=unauthorized', request.url),
  );

  response.cookies.delete('aprende-y-aplica-session');
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');
  deleteSupabaseAuthCookies(request, response);

  return response;
}

export function createForbiddenResponse(request: NextRequest): NextResponse {
  return NextResponse.redirect(
    new URL('/dashboard?error=insufficient_permissions', request.url),
  );
}

export function buildAccessFailureResponse(
  request: NextRequest,
  result: ValidationResult,
) {
  if (
    result.error === 'No session found' ||
    result.error === 'Invalid session' ||
    result.error === 'Session expired'
  ) {
    return createUnauthorizedResponse(request);
  }

  return createForbiddenResponse(request);
}

function deleteSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')) {
      response.cookies.delete(cookie.name);
    }
  }
}
