import { NextRequest, NextResponse } from 'next/server';
import { buildAccessFailureResponse, createForbiddenResponse } from './auth.responses';
import { validateRoleAccess } from './auth.validation';
import {
  VALID_ROLES,
  ROLE_ROUTES,
  type SecurityEvent,
  type ValidRole,
} from './auth.types';

export { validateRoleAccess } from './auth.validation';
export { VALID_ROLES, ROLE_ROUTES };
export type { SecurityEvent, ValidRole };

export async function validateAdminAccess(
  request: NextRequest,
): Promise<NextResponse | null> {
  const result = await validateRoleAccess(request, 'Administrador');
  return result.isValid ? null : buildAccessFailureResponse(request, result);
}

export async function validateInstructorAccess(
  request: NextRequest,
): Promise<NextResponse | null> {
  const result = await validateRoleAccess(request);

  if (!result.isValid) {
    return buildAccessFailureResponse(request, result);
  }

  return result.role === 'Instructor' || result.role === 'Administrador'
    ? null
    : createForbiddenResponse(request);
}

export async function validateUserAccess(
  request: NextRequest,
): Promise<NextResponse | null> {
  const result = await validateRoleAccess(request);
  return result.isValid ? null : buildAccessFailureResponse(request, result);
}

export async function validateBusinessAccess(
  request: NextRequest,
): Promise<NextResponse | null> {
  const result = await validateRoleAccess(request);

  if (!result.isValid) {
    return buildAccessFailureResponse(request, result);
  }

  return result.role === 'Business' || result.role === 'Administrador'
    ? null
    : createForbiddenResponse(request);
}
