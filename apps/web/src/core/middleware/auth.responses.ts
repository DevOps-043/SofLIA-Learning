import { NextRequest, NextResponse } from 'next/server';
import type { ValidationResult } from './auth.types';

export function createUnauthorizedResponse(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(
    new URL('/auth?error=unauthorized', request.url),
  );

  response.cookies.delete('aprende-y-aplica-session');
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');

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
